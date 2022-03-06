import * as path from 'path';
import { fs, types, util } from 'vortex-api';
import { ISnippet } from './types';
import ThemeSnippets from './ThemeSnippets';
import { isCustomTheme, themePath } from './util';
import { SNIPPETS_URL } from './config';

const snippetInfo: { snippets: ISnippet[], time: Date } = util.makeReactive({
  snippets: [],
  time: undefined,
});

function snippetsPath(): string {
  return path.join(util.getVortexPath('temp'), 'snippets.scss');
}

async function LoadSnippets() {
  let snippetsData: string;
  try {
    const filePath = snippetsPath();
    const stats: fs.Stats = await fs.statAsync(filePath);
    snippetsData = await fs.readFileAsync(filePath, { encoding: 'utf8' });
    snippetInfo.time = stats.ctime;
  } catch (err) {
    snippetsData = await fs.readFileAsync(
      path.join(__dirname, 'snippets.scss'), { encoding: 'utf8' });
    snippetInfo.time = undefined;
  }

  // awkward way to split blocks
  const blocks = snippetsData
    .replace(new RegExp(`\r?\n`, 'g'), '~~~')
    .replace(/\/\/ endsnippet/g, '\n')
    .match(/(\/\/ id.*)/g)
    .map(b => b.replace(/~~~/g, '\n').trim());

  snippetInfo.snippets = blocks
    .map(block => block
        .split('\n')
        .reduce((prev, line) => {
          const m = line.match(/\/\/ ([^:]*): (.*)/);
          if (m === null) {
            prev.code += line;
          } else {
            prev[m[1]] = m[2];
          }
          return prev;
        }, { id: '', name: '', description: '', code: '' }));
}

async function onRead(theme: string): Promise<{ [id: string]: boolean }> {
  const fPath = path.join(themePath(), theme, 'snippets.scss');
  try {
    const snippetsSCSS = await fs.readFileAsync(fPath, { encoding: 'utf8' });

    return snippetInfo.snippets.reduce((prev, snip) => {
      prev[snip.id] = snippetsSCSS.includes(`// ${snip.id}`);
      return prev;
    }, {});
  } catch (err) {
    return Promise.resolve({});
  }
}

const importStatement = '@import "snippets.scss";';
const importComment = 'The above import was added automatically. Please leave it in '
                    + 'the very first line, otherwise it will be added again.';

const snippetsHeader = '// Automatically generated, Please don\'t edit this file';

async function onSave(api: types.IExtensionApi, theme: string, state: { [id: string]: boolean }) {
  {
    const fPath = path.join(themePath(), theme, 'snippets.scss');
    await fs.writeFileAsync(fPath, snippetsHeader + '\n\n' + snippetInfo.snippets
      .filter(s => state[s.id])
      .map(s => `// ${[s.id, s.code].join('\n')}\n`)
      .join('\n'));
  }

  {
    const fPath = path.join(themePath(), theme, 'style.scss')
    try {
      const existingStyle = await fs.readFileAsync(fPath, { encoding: 'utf8' });
      if (!existingStyle.startsWith(importStatement)) {
        await fs.writeFileAsync(fPath,
          [importStatement, `// ${importComment}`, existingStyle].join('\n'));
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        await fs.writeFileAsync(fPath, importStatement);
      } else {
        api.showErrorNotification(
          'Failed to update style.scss, snippets won\'t be applied',
          err);
      }
    }
  }
  api.events.emit('select-theme', theme);
}

async function downloadSnippets(api: types.IExtensionApi) {
  try {
    const snippetDat = await util.rawRequest(SNIPPETS_URL, { encoding: 'utf8' });
    await fs.writeFileAsync(snippetsPath(), snippetDat, { encoding: 'utf8' });
    await LoadSnippets();
  } catch (err) {
    api.showErrorNotification('Failed to download snippets', err, { allowReport: false });
  }
}

//This is the main function Vortex will run when detecting the game extension. 
function main(context: types.IExtensionContext) {
  const saveDebouncer = new util.Debouncer((theme: string, state: { [id: string]: boolean }) => {
    return onSave(context.api, theme, state);
  }, 1000);

  context.registerSettings('Theme', ThemeSnippets, () => ({
      snippetInfo,
      isCustomTheme,
      downloadSnippets: () => downloadSnippets(context.api),
      onRead,
      onSave: (theme: string, state: { [id: string]: boolean }) =>
        saveDebouncer.schedule(undefined, theme, state),
    }), undefined, 150);

  context.once(() => {
    context.api.setStylesheet('theme-snippets', path.join(__dirname, 'style.scss'));
    LoadSnippets()
      .catch(err => {
        context.api.showErrorNotification('Failed to load snippets', err, {
          allowReport: false,
        });
      });
  });

  return true;
}

export default main;
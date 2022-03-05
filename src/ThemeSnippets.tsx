import * as React from 'react';
import { Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import {  More, Toggle, tooltip, types, util } from 'vortex-api';
import { CONTRIBUTE_URL } from './config';
import { ISnippet } from './types';

export interface IThemeSnippetsProps {
  snippets: ISnippet[];
  snippetTime: Date;
  isCustomTheme: (themeName: string) => Promise<boolean>;
  downloadSnippets: () => Promise<void>;
  onRead: (theme: string) => Promise<{ [id: string]: boolean }>;
  onSave: (theme: string, state: { [id: string]: boolean }) => Promise<void>;
}

function ThemeSnippets(props: IThemeSnippetsProps) {
  const { isCustomTheme, onRead, onSave, snippets, snippetTime } = props;

  const { t } = useTranslation('theme-snippets');

  const [isCustom, setIsCustom] = React.useState(false);
  const [snippetState, setSnippetState] = React.useState({});

  const { currentTheme, language } = useSelector<types.IState, any>(state => ({
    currentTheme: state.settings.interface['currentTheme'],
    language: state.settings.interface.language,
  }));

  React.useEffect(() => {
    (async () => {
      const isCustom = await isCustomTheme(currentTheme);
      setIsCustom(isCustom);
      if (isCustom) {
        setSnippetState(await onRead(currentTheme));
      }
    })();
  }, [currentTheme, onRead])

  const toggle = React.useCallback((value: boolean, dataId: string) => {
    const newState = {
      ...snippetState,
      [dataId]: value,
    };
    setSnippetState(newState);
    onSave(currentTheme, newState);
  }, [onSave, setSnippetState, snippetState]);

  const openGithub = React.useCallback(() => {
    util.opn(CONTRIBUTE_URL);
  }, []);

  return (
    <div>
      <Alert bsStyle='warning'>
        {t('There is no guarantee that every combination of these snippets works correctly')}
      </Alert>
      <div className='theme-snippet-grid'>
        {snippets.map(snippet => (
          <Toggle
            disabled={!isCustom}
            checked={snippetState[snippet.id]}
            dataId={snippet.id}
            onToggle={toggle}
          >
            {t(snippet.name)}
            <More id={snippet.id} name={t(snippet.name)}>
              {t(snippet.description)}
            </More>
          </Toggle>
        ))}
      </div>
      <tooltip.Button tooltip={t('Download updated snippets from github')} >
        {t('Download updates')}
      </tooltip.Button>
      <p style={{ display: 'inline', marginLeft: '1em' }}>{t('Last updated: {{time}}', { replace: {
        time: snippetTime !== undefined ? snippetTime.toLocaleString(language) : t('Bundled'),
      } })}</p>

      <a href='#' onClick={openGithub} style={{ marginTop: '1em' }} >
        {t('Suggest further snippets')}
      </a>
    </div>
  );
}

export default ThemeSnippets;

import * as React from 'react';
import { Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { ComponentEx, More, Toggle, tooltip, types, util } from 'vortex-api';
import { CONTRIBUTE_URL } from './config';
import { ISnippet } from './types';

export interface IThemeSnippetsProps {
  snippetInfo: {
    snippets: ISnippet[],
    time: Date,
  };
  isCustomTheme: (themeName: string) => Promise<boolean>;
  downloadSnippets: () => Promise<void>;
  onRead: (theme: string) => Promise<{ [id: string]: boolean }>;
  onSave: (theme: string, state: { [id: string]: boolean }) => Promise<void>;
}

function ThemeSnippets(props: IThemeSnippetsProps) {
  const { downloadSnippets, isCustomTheme, onRead, onSave } = props;
  const { snippets, time } = props.snippetInfo;

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

  const download = React.useCallback(() => {
    (async () => {
      await downloadSnippets();
    })();
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
      <tooltip.Button
        tooltip={t('Download updated snippets from github')}
        onClick={download}
      >
        {t('Download snippets')}
      </tooltip.Button>
      <p style={{ display: 'inline', marginLeft: '1em' }}>{t('Last updated: {{time}}', { replace: {
        time: (time !== undefined) ? time.toLocaleString(language) : t('Bundled'),
      } })}</p>

      <div style={{ marginTop: '1em' }}>
        <a href='#' onClick={openGithub} style={{ marginTop: '1em' }} >
          {t('Suggest further snippets')}
        </a>
      </div>
    </div>
  );
}

// need this as a hack to make the makeReactive prop work as expected as it doesn't
// support functional components atm
class ThemeSnippetsProxy extends ComponentEx<IThemeSnippetsProps, {}> {
  public componentDidMount() {
    this.props.snippetInfo['attach']?.(this);
  }

  public componentWillUnmount() {
    this.props.snippetInfo['detach']?.(this);
  }

  public render() {
    return <ThemeSnippets {...this.props} />
  }
}

export default ThemeSnippetsProxy;

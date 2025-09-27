import useContent from './hooks/useContent.js';
import useHealthCheck from './hooks/useHealthCheck.js';
import styles from './app.styles.scss';

const App = () => {
  const homeContent = useContent('home');
  const {
    data: healthData,
    isError: isHealthError,
    isFetching: isHealthFetching
  } = useHealthCheck();

  if (!homeContent) {
    return <div className={styles.container}>Loading...</div>;
  }

  const handleCtaClick = () => {
    window.location.href = '/signup';
  };

  const healthStatusLabel = () => {
    if (isHealthFetching) {
      return 'Checking...';
    }

    if (isHealthError || !healthData?.ok) {
      return 'Offline';
    }

    return 'Online';
  };

  const healthStatusClass = () => {
    if (isHealthError || !healthData?.ok) {
      return styles.statusError;
    }

    return styles.statusOk;
  };

  return (
    <main className={styles.container}>
      <h1 className={styles.headline}>{homeContent.headline}</h1>
      <p className={styles.subheadline}>{homeContent.subheadline}</p>
      <button type="button" className={styles.ctaButton} onClick={handleCtaClick}>
        {homeContent.cta}
      </button>
      <p className={styles.healthStatus}>
        API status: <span className={healthStatusClass()}>{healthStatusLabel()}</span>
      </p>
    </main>
  );
};

export default App;

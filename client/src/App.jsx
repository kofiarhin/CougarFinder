import useContent from './hooks/useContent.js';
import styles from './app.styles.scss';

const App = () => {
  const homeContent = useContent('home');

  if (!homeContent) {
    return <div className={styles.container}>Loading...</div>;
  }

  const handleCtaClick = () => {
    window.location.href = '/signup';
  };

  return (
    <main className={styles.container}>
      <h1 className={styles.headline}>{homeContent.headline}</h1>
      <p className={styles.subheadline}>{homeContent.subheadline}</p>
      <button type="button" className={styles.ctaButton} onClick={handleCtaClick}>
        {homeContent.cta}
      </button>
    </main>
  );
};

export default App;

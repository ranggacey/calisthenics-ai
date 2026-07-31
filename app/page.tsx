import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Calisthenics AI Trainer</h1>
        <p className={styles.subtitle}>Your personal AI-powered calisthenics coach</p>
      </header>
      
      <section className={styles.features}>
        <div className={styles.feature}>
          <h3>🎯 Pose Detection</h3>
          <p>Real-time form analysis using MediaPipe</p>
        </div>
        <div className={styles.feature}>
          <h3>🏆 Gamification</h3>
          <p>Achievements, streaks, levels & daily quests</p>
        </div>
        <div className={styles.feature}>
          <h3>📊 Progress Tracking</h3>
          <p>Tempo tracking, rep counting & workout history</p>
        </div>
        <div className={styles.feature}>
          <h3>🔊 Audio Feedback</h3>
          <p>Real-time beeps for form correction</p>
        </div>
      </section>

      <Link 
        href="/workout" 
        className={styles.cta}
      >
        Start Workout →
      </Link>

      <footer className={styles.footer}>
        <p>Built with Next.js, MediaPipe & Web Audio API</p>
      </footer>
    </main>
  );
}
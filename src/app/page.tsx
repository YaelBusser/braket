import Link from 'next/link'
import styles from './page.module.scss'

// Cette page reste en SSR (Server Side Rendering)
export default function Home() {
  return (
    <main className={styles.hero}>
      <div className="container">
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Organisez vos tournois avec{' '}
            <span className={styles.heroAccent}>LeTournoi</span>
          </h1>
          <p className={styles.heroDescription}>
            La plateforme moderne pour créer, gérer et participer à des tournois de jeux vidéo, 
            sport ou jeux de société. Simple, rapide et professionnel.
          </p>
          <div className={styles.heroActions}>
            <Link href="/register" className="btn btn-primary btn-lg">
              Créer un compte
            </Link>
            <Link href="/login" className="btn btn-outline btn-lg">
              Se connecter
            </Link>
          </div>
        </div>
        
        <div className={styles.heroFeatures}>
          <div className="card-grid">
            <div className="card">
              <div className="card-body">
                <h3>🎮 Jeux vidéo</h3>
                <p>Organisez des tournois pour tous vos jeux favoris</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <h3>⚽ Sports</h3>
                <p>Gérez des compétitions sportives de A à Z</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <h3>🎲 Jeux de société</h3>
                <p>Créez des tournois pour vos jeux de plateau</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
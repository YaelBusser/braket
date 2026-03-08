import styles from '../legal.module.scss'

export const metadata = {
  title: 'Politique des cookies - Braket',
  description: 'Politique des cookies de la plateforme Braket.',
}

export default function CookiesPage() {
  return (
    <div className={styles.legalPage}>
      <div className={styles.container}>
        <h1 className={styles.title}>Politique des cookies</h1>
        <p className={styles.lastUpdated}>Dernière mise à jour : 8 mars 2026</p>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
          <p className={styles.paragraph}>
            Un cookie est un petit fichier texte déposé sur votre navigateur lors de la visite d&apos;un site
            web. Il permet de stocker des informations relatives à votre navigation afin d&apos;améliorer
            votre expérience utilisateur.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Cookies utilisés sur Braket</h2>

          <h3 className={styles.sectionTitle} style={{ fontSize: '1rem', borderBottom: 'none', marginTop: '1rem' }}>
            Cookies strictement nécessaires
          </h3>
          <p className={styles.paragraph}>
            Ces cookies sont indispensables au fonctionnement du site. Ils ne peuvent pas être désactivés.
          </p>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cookie</th>
                <th>Finalité</th>
                <th>Durée</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>next-auth.session-token</td>
                <td>Maintien de votre session de connexion</td>
                <td>30 jours</td>
              </tr>
              <tr>
                <td>next-auth.csrf-token</td>
                <td>Protection contre les attaques CSRF</td>
                <td>Session</td>
              </tr>
              <tr>
                <td>next-auth.callback-url</td>
                <td>Redirection après authentification</td>
                <td>Session</td>
              </tr>
            </tbody>
          </table>

          <h3 className={styles.sectionTitle} style={{ fontSize: '1rem', borderBottom: 'none', marginTop: '1.5rem' }}>
            Cookies analytiques (optionnels)
          </h3>
          <p className={styles.paragraph}>
            Ces cookies ne sont déposés que si vous acceptez les cookies via le bandeau de consentement.
          </p>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cookie</th>
                <th>Finalité</th>
                <th>Durée</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>_ga</td>
                <td>Google Analytics — distinction des utilisateurs</td>
                <td>2 ans</td>
              </tr>
              <tr>
                <td>_ga_*</td>
                <td>Google Analytics — état de la session</td>
                <td>2 ans</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Stockage local</h2>
          <p className={styles.paragraph}>
            En complément des cookies, nous utilisons le stockage local (localStorage) de votre navigateur :
          </p>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Clé</th>
                <th>Finalité</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>cookie-consent</td>
                <td>Mémorisation de votre choix concernant les cookies analytiques</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Gérer vos préférences</h2>
          <p className={styles.paragraph}>
            Lors de votre première visite, un bandeau vous propose d&apos;accepter ou de refuser les cookies
            analytiques. Votre choix est enregistré et les cookies Google Analytics ne sont chargés que
            si vous les acceptez.
          </p>
          <p className={styles.paragraph}>
            Vous pouvez également gérer les cookies directement depuis les paramètres de votre navigateur :
          </p>
          <ul className={styles.list}>
            <li><strong>Chrome :</strong> Paramètres &gt; Confidentialité et sécurité &gt; Cookies</li>
            <li><strong>Firefox :</strong> Paramètres &gt; Vie privée et sécurité &gt; Cookies</li>
            <li><strong>Safari :</strong> Préférences &gt; Confidentialité</li>
            <li><strong>Edge :</strong> Paramètres &gt; Cookies et autorisations de site</li>
          </ul>
          <p className={styles.paragraph}>
            La suppression des cookies peut affecter votre expérience de navigation et nécessiter une
            nouvelle connexion.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Contact</h2>
          <p className={styles.paragraph}>
            Pour toute question relative aux cookies, contactez-nous à{' '}
            <a href="mailto:contact@braket-tournament.com" className={styles.link}>contact@braket-tournament.com</a>.
          </p>
        </section>
      </div>
    </div>
  )
}

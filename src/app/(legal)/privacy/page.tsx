import Link from 'next/link'
import styles from '../legal.module.scss'

export const metadata = {
  title: 'Politique de confidentialité - Braket',
  description: 'Politique de confidentialité de la plateforme Braket.',
}

export default function PrivacyPage() {
  return (
    <div className={styles.legalPage}>
      <div className={styles.container}>
        <h1 className={styles.title}>Politique de confidentialité</h1>
        <p className={styles.lastUpdated}>Dernière mise à jour : 8 mars 2026</p>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Responsable du traitement</h2>
          <div className={styles.contactInfo}>
            <p><strong>Braket</strong></p>
            <p>MyDigitalSchool — Angers</p>
            <p>Email : <a href="mailto:contact@braket-tournament.com" className={styles.link}>contact@braket-tournament.com</a></p>
          </div>
          <p className={styles.paragraph}>
            Braket s&apos;engage à protéger la vie privée de ses utilisateurs conformément au Règlement Général
            sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Données collectées</h2>
          <p className={styles.paragraph}>
            Dans le cadre de l&apos;utilisation de la plateforme, nous collectons les données suivantes :
          </p>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Donnée</th>
                <th>Finalité</th>
                <th>Base légale</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Adresse e-mail</td>
                <td>Création de compte, authentification</td>
                <td>Exécution du contrat</td>
              </tr>
              <tr>
                <td>Pseudo</td>
                <td>Identification publique sur la plateforme</td>
                <td>Exécution du contrat</td>
              </tr>
              <tr>
                <td>Mot de passe (hashé)</td>
                <td>Authentification sécurisée</td>
                <td>Exécution du contrat</td>
              </tr>
              <tr>
                <td>Avatar et bannière</td>
                <td>Personnalisation du profil</td>
                <td>Consentement</td>
              </tr>
              <tr>
                <td>Données de navigation</td>
                <td>Analyse d&apos;audience (Google Analytics)</td>
                <td>Consentement (cookies)</td>
              </tr>
            </tbody>
          </table>
          <p className={styles.paragraph}>
            En cas de connexion via Google ou Discord (OAuth), nous recevons votre nom, adresse e-mail et
            photo de profil depuis ces services.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Finalités du traitement</h2>
          <ul className={styles.list}>
            <li>Gestion de votre compte utilisateur</li>
            <li>Participation et organisation de tournois</li>
            <li>Gestion des équipes et invitations</li>
            <li>Messagerie dans les matchs</li>
            <li>Notifications liées à l&apos;activité de la plateforme</li>
            <li>Analyse statistique anonymisée de l&apos;utilisation du site</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Sous-traitants et transferts de données</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Service</th>
                <th>Usage</th>
                <th>Localisation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>OmgServ</td>
                <td>Hébergement du site</td>
                <td>France</td>
              </tr>
              <tr>
                <td>Google Analytics</td>
                <td>Analyse d&apos;audience (si cookies acceptés)</td>
                <td>États-Unis</td>
              </tr>
              <tr>
                <td>Google OAuth</td>
                <td>Connexion via compte Google</td>
                <td>États-Unis</td>
              </tr>
              <tr>
                <td>Discord OAuth</td>
                <td>Connexion via compte Discord</td>
                <td>États-Unis</td>
              </tr>
            </tbody>
          </table>
          <p className={styles.paragraph}>
            Les transferts vers les États-Unis sont encadrés par les clauses contractuelles types de la
            Commission européenne.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Durée de conservation</h2>
          <ul className={styles.list}>
            <li>Données de compte : conservées tant que le compte est actif</li>
            <li>Données de navigation (analytics) : 14 mois maximum</li>
            <li>En cas de suppression de compte, toutes les données personnelles sont effacées immédiatement</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Vos droits</h2>
          <p className={styles.paragraph}>
            Conformément au RGPD, vous disposez des droits suivants :
          </p>
          <ul className={styles.list}>
            <li><strong>Droit d&apos;accès :</strong> obtenir une copie de vos données personnelles</li>
            <li><strong>Droit de rectification :</strong> corriger vos données depuis les paramètres de votre compte</li>
            <li><strong>Droit à l&apos;effacement :</strong> supprimer votre compte et toutes vos données associées</li>
            <li><strong>Droit à la portabilité :</strong> exporter vos données dans un format structuré (JSON)</li>
            <li><strong>Droit d&apos;opposition :</strong> refuser le traitement de vos données à des fins d&apos;analyse</li>
          </ul>
          <p className={styles.paragraph}>
            Vous pouvez exercer ces droits directement depuis la page{' '}
            <Link href="/settings" className={styles.link}>Paramètres</Link> de votre compte
            ou en nous contactant à{' '}
            <a href="mailto:contact@braket-tournament.com" className={styles.link}>contact@braket-tournament.com</a>.
          </p>
          <p className={styles.paragraph}>
            Vous disposez également du droit d&apos;introduire une réclamation auprès de la CNIL
            (<a href="https://www.cnil.fr" className={styles.link} target="_blank" rel="noopener noreferrer">www.cnil.fr</a>).
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Sécurité</h2>
          <p className={styles.paragraph}>
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger
            vos données : chiffrement des mots de passe (bcrypt), communications HTTPS, tokens de session
            sécurisés, protection CSRF.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>8. Modifications</h2>
          <p className={styles.paragraph}>
            Cette politique peut être mise à jour. En cas de modification substantielle, les utilisateurs
            seront informés via la plateforme. La date de dernière mise à jour est indiquée en haut de
            cette page.
          </p>
        </section>
      </div>
    </div>
  )
}

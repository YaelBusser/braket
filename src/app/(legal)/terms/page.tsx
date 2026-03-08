import styles from '../legal.module.scss'

export const metadata = {
  title: 'Conditions générales d\'utilisation - Braket',
  description: 'Conditions générales d\'utilisation de la plateforme Braket.',
}

export default function TermsPage() {
  return (
    <div className={styles.legalPage}>
      <div className={styles.container}>
        <h1 className={styles.title}>Conditions générales d&apos;utilisation</h1>
        <p className={styles.lastUpdated}>Dernière mise à jour : 8 mars 2026</p>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Objet</h2>
          <p className={styles.paragraph}>
            Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;accès et l&apos;utilisation
            de la plateforme Braket, accessible à l&apos;adresse braket-tournament.com. En créant un compte,
            l&apos;utilisateur accepte sans réserve les présentes conditions.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Description du service</h2>
          <p className={styles.paragraph}>
            Braket est une plateforme de gestion de tournois de jeux vidéo permettant aux utilisateurs de :
          </p>
          <ul className={styles.list}>
            <li>Créer et gérer des tournois (simple élimination, double élimination, round-robin)</li>
            <li>Créer et rejoindre des équipes</li>
            <li>S&apos;inscrire à des tournois en solo ou en équipe</li>
            <li>Communiquer via la messagerie de match</li>
            <li>Consulter des statistiques et classements</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Inscription et compte</h2>
          <p className={styles.paragraph}>
            L&apos;inscription est gratuite et ouverte à toute personne physique âgée d&apos;au moins 13 ans.
            L&apos;utilisateur s&apos;engage à fournir des informations exactes lors de son inscription et à
            maintenir la confidentialité de ses identifiants.
          </p>
          <p className={styles.paragraph}>
            L&apos;inscription peut se faire par la création d&apos;un compte avec email et mot de passe, ou
            via les services d&apos;authentification Google et Discord.
          </p>
          <p className={styles.paragraph}>
            Chaque utilisateur est responsable de toute activité effectuée depuis son compte.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Règles de conduite</h2>
          <p className={styles.paragraph}>
            L&apos;utilisateur s&apos;engage à :
          </p>
          <ul className={styles.list}>
            <li>Respecter les autres utilisateurs et ne pas tenir de propos injurieux, discriminatoires ou haineux</li>
            <li>Ne pas tricher ou utiliser de moyens déloyaux lors des tournois</li>
            <li>Ne pas usurper l&apos;identité d&apos;un tiers</li>
            <li>Ne pas diffuser de contenu illicite, offensant ou inapproprié</li>
            <li>Ne pas tenter de compromettre la sécurité ou le bon fonctionnement de la plateforme</li>
            <li>Respecter les règles spécifiques de chaque tournoi auquel il participe</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Propriété intellectuelle</h2>
          <p className={styles.paragraph}>
            L&apos;ensemble des éléments de la plateforme (design, code, logo, textes) sont la propriété
            de Braket et sont protégés par les lois relatives à la propriété intellectuelle.
          </p>
          <p className={styles.paragraph}>
            Les noms et logos des jeux vidéo présents sur la plateforme appartiennent à leurs éditeurs
            respectifs. Leur utilisation sur Braket est faite à titre informatif.
          </p>
          <p className={styles.paragraph}>
            Le contenu publié par les utilisateurs (avatars, messages, descriptions) reste la propriété
            de leurs auteurs. En le publiant, l&apos;utilisateur accorde à Braket une licence non exclusive
            d&apos;affichage sur la plateforme.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Responsabilités</h2>
          <p className={styles.paragraph}>
            Braket met tout en œuvre pour assurer la disponibilité et le bon fonctionnement de la
            plateforme, mais ne peut garantir une disponibilité sans interruption.
          </p>
          <p className={styles.paragraph}>
            Braket ne saurait être tenu responsable des contenus publiés par les utilisateurs, ni des
            résultats ou de l&apos;organisation des tournois créés par les utilisateurs.
          </p>
          <p className={styles.paragraph}>
            L&apos;utilisateur est seul responsable de l&apos;utilisation qu&apos;il fait de la plateforme et de son
            comportement lors des tournois.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Suspension et résiliation</h2>
          <p className={styles.paragraph}>
            Braket se réserve le droit de suspendre ou supprimer un compte en cas de non-respect des
            présentes CGU, sans préavis ni indemnité.
          </p>
          <p className={styles.paragraph}>
            L&apos;utilisateur peut à tout moment supprimer son compte depuis la page Paramètres. La
            suppression entraîne l&apos;effacement de l&apos;ensemble des données personnelles associées.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>8. Protection des données</h2>
          <p className={styles.paragraph}>
            Les données personnelles des utilisateurs sont traitées conformément à notre{' '}
            <a href="/privacy" className={styles.link}>Politique de confidentialité</a>.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>9. Modifications des CGU</h2>
          <p className={styles.paragraph}>
            Braket peut modifier les présentes CGU à tout moment. Les utilisateurs seront informés de
            toute modification substantielle. La poursuite de l&apos;utilisation de la plateforme après
            modification vaut acceptation des nouvelles conditions.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>10. Droit applicable</h2>
          <p className={styles.paragraph}>
            Les présentes CGU sont soumises au droit français. En cas de litige, les parties
            s&apos;efforceront de trouver une solution amiable. À défaut, les tribunaux compétents
            d&apos;Angers seront seuls compétents.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>11. Contact</h2>
          <div className={styles.contactInfo}>
            <p><strong>Braket</strong></p>
            <p>MyDigitalSchool — Angers</p>
            <p>Email : <a href="mailto:contact@braket-tournament.com" className={styles.link}>contact@braket-tournament.com</a></p>
          </div>
        </section>
      </div>
    </div>
  )
}

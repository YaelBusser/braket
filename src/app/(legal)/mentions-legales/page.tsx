import styles from '../legal.module.scss'

export const metadata = {
  title: 'Mentions légales - Braket',
  description: 'Mentions légales de la plateforme Braket.',
}

export default function MentionsLegalesPage() {
  return (
    <div className={styles.legalPage}>
      <div className={styles.container}>
        <h1 className={styles.title}>Mentions légales</h1>
        <p className={styles.lastUpdated}>Dernière mise à jour : 8 mars 2026</p>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Éditeur du site</h2>
          <div className={styles.contactInfo}>
            <p><strong>Braket</strong></p>
            <p>Projet réalisé dans le cadre de la formation MyDigitalSchool</p>
            <p>Adresse : MyDigitalSchool — Angers</p>
            <p>Email : <a href="mailto:contact@braket-tournament.com" className={styles.link}>contact@braket-tournament.com</a></p>
            <p>Directeur de la publication : Équipe Braket</p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Hébergeur</h2>
          <div className={styles.contactInfo}>
            <p><strong>OmgServ</strong></p>
            <p>SAS au capital variable</p>
            <p>Site web : <a href="https://www.omgserv.com" className={styles.link} target="_blank" rel="noopener noreferrer">www.omgserv.com</a></p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Propriété intellectuelle</h2>
          <p className={styles.paragraph}>
            L&apos;ensemble du contenu du site Braket (textes, graphismes, logo, icônes, images, code source)
            est la propriété exclusive de Braket, sauf mention contraire. Toute reproduction, représentation
            ou diffusion, en tout ou partie, du contenu de ce site sans autorisation est interdite.
          </p>
          <p className={styles.paragraph}>
            Les noms, logos et visuels des jeux vidéo référencés sur la plateforme sont la propriété de
            leurs éditeurs respectifs.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Protection des données personnelles</h2>
          <p className={styles.paragraph}>
            Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d&apos;un droit d&apos;accès,
            de rectification, de suppression et de portabilité de vos données personnelles.
          </p>
          <p className={styles.paragraph}>
            Pour en savoir plus, consultez notre{' '}
            <a href="/privacy" className={styles.link}>Politique de confidentialité</a>.
          </p>
          <p className={styles.paragraph}>
            Pour exercer vos droits, contactez-nous à{' '}
            <a href="mailto:contact@braket-tournament.com" className={styles.link}>contact@braket-tournament.com</a>.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Cookies</h2>
          <p className={styles.paragraph}>
            Le site utilise des cookies pour son bon fonctionnement et, avec votre consentement, à des fins
            d&apos;analyse statistique. Pour en savoir plus, consultez notre{' '}
            <a href="/cookies" className={styles.link}>Politique des cookies</a>.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Limitation de responsabilité</h2>
          <p className={styles.paragraph}>
            Braket s&apos;efforce de fournir des informations aussi précises que possible. Toutefois, Braket ne
            pourra être tenu responsable des omissions, inexactitudes ou carences dans la mise à jour,
            qu&apos;elles soient de son fait ou du fait de tiers.
          </p>
          <p className={styles.paragraph}>
            Braket ne pourra être tenu responsable des dommages directs ou indirects résultant de l&apos;accès
            ou de l&apos;utilisation du site, y compris l&apos;inaccessibilité, les pertes de données ou les
            virus informatiques.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Droit applicable</h2>
          <p className={styles.paragraph}>
            Les présentes mentions légales sont régies par le droit français. En cas de litige, les
            tribunaux d&apos;Angers seront seuls compétents.
          </p>
        </section>
      </div>
    </div>
  )
}

import React from 'react'
import ContentWithTabs from '../ContentWithTabs'
import styles from './index.module.scss'

export default function TournamentPageSkeleton() {
  return (
    <div className={styles.skeletonPage}>
      {/* Bannière skeleton */}
      <div className={styles.skeletonBanner}>
        <div className={styles.bannerContent}>
          <div className={styles.bannerInner}>
            {/* Photo de profil */}
            <div className={styles.skeletonProfilePicture}></div>
            
            {/* Infos bannière */}
            <div className={styles.bannerInfo}>
              <div className={styles.skeletonTitle}></div>
              <div className={styles.skeletonEventDetails}></div>
              <div className={styles.skeletonStatusTag}></div>
            </div>
            
            {/* Section droite */}
            <div className={styles.bannerRight}>
              {/* Compte à rebours */}
              <div className={styles.skeletonCountdown}>
                <div className={styles.skeletonCountdownUnit}></div>
                <div className={styles.skeletonCountdownSeparator}></div>
                <div className={styles.skeletonCountdownUnit}></div>
                <div className={styles.skeletonCountdownSeparator}></div>
                <div className={styles.skeletonCountdownUnit}></div>
                <div className={styles.skeletonCountdownSeparator}></div>
                <div className={styles.skeletonCountdownUnit}></div>
              </div>
              
              {/* Bouton rejoindre */}
              <div className={styles.skeletonJoinButton}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <ContentWithTabs style={{ marginTop: '3rem' }}>
        {/* Tabs skeleton */}
        <div className={styles.skeletonTabs}>
          <div className={styles.skeletonTab}></div>
          <div className={styles.skeletonTab}></div>
          <div className={styles.skeletonTab}></div>
          <div className={styles.skeletonTab}></div>
          <div className={styles.skeletonTab}></div>
        </div>

        {/* Sections Format et Équipes */}
        <div className={styles.sectionsGrid}>
          {/* Section Format */}
          <div className={styles.section}>
            <div className={styles.skeletonSectionTitle}></div>
            <div className={styles.formatGrid}>
              {/* Carte Jeu */}
              <div className={styles.skeletonFormatCard}>
                <div className={styles.skeletonFormatIcon}></div>
                <div className={styles.skeletonFormatContent}>
                  <div className={styles.skeletonFormatLabel}></div>
                  <div className={styles.skeletonFormatValue}></div>
                </div>
              </div>
              {/* Carte Fenêtre de préparation */}
              <div className={styles.skeletonFormatCard}>
                <div className={styles.skeletonFormatIcon}></div>
                <div className={styles.skeletonFormatContent}>
                  <div className={styles.skeletonFormatLabel}></div>
                  <div className={styles.skeletonFormatValue}></div>
                </div>
              </div>
              {/* Carte Taille équipe */}
              <div className={styles.skeletonFormatCard}>
                <div className={styles.skeletonFormatIcon}></div>
                <div className={styles.skeletonFormatContent}>
                  <div className={styles.skeletonFormatLabel}></div>
                  <div className={styles.skeletonFormatValue}></div>
                </div>
              </div>
              {/* Carte Format */}
              <div className={styles.skeletonFormatCard}>
                <div className={styles.skeletonFormatIcon}></div>
                <div className={styles.skeletonFormatContent}>
                  <div className={styles.skeletonFormatLabel}></div>
                  <div className={styles.skeletonFormatValue}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Équipes */}
          <div className={styles.section}>
            <div className={styles.skeletonSectionTitle}></div>
            <div className={styles.teamsStats}>
              <div className={styles.skeletonTeamStat}>
                <div className={styles.skeletonTeamStatLabel}></div>
                <div className={styles.skeletonTeamStatValue}></div>
              </div>
              <div className={styles.skeletonTeamStat}>
                <div className={styles.skeletonTeamStatLabel}></div>
                <div className={styles.skeletonTeamStatValue}></div>
              </div>
              <div className={styles.skeletonTeamStat}>
                <div className={styles.skeletonTeamStatLabel}></div>
                <div className={styles.skeletonTeamStatValue}></div>
              </div>
            </div>
            <div className={styles.teamsAvatars}>
              <div className={styles.skeletonTeamAvatar}></div>
              <div className={styles.skeletonTeamAvatar}></div>
              <div className={styles.skeletonTeamAvatar}></div>
              <div className={styles.skeletonTeamAvatar}></div>
              <div className={styles.skeletonTeamNames}></div>
            </div>
          </div>
        </div>

        {/* Sections Hébergé par et Calendrier */}
        <div className={styles.sectionsGrid}>
          {/* Section Hébergé par */}
          <div className={styles.section}>
            <div className={styles.skeletonSectionTitle}></div>
            <div className={styles.skeletonHostCard}>
              <div className={styles.skeletonHostAvatar}></div>
              <div className={styles.skeletonHostContent}>
                <div className={styles.skeletonHostName}></div>
                <div className={styles.skeletonHostRole}></div>
              </div>
              <div className={styles.skeletonHostButton}></div>
            </div>
          </div>

          {/* Section Calendrier */}
          <div className={styles.section}>
            <div className={styles.skeletonSectionTitle}></div>
            <div className={styles.skeletonTimeline}>
              {/* Item 1 */}
              <div className={styles.skeletonTimelineItem}>
                <div className={styles.skeletonTimelineDot}>
                  <div className={styles.skeletonTimelineLine}>
                    <div className={styles.skeletonTimelineCircle}></div>
                  </div>
                </div>
                <div className={styles.skeletonTimelineContent}>
                  <div className={styles.skeletonTimelineDate}></div>
                  <div className={styles.skeletonTimelineTitle}></div>
                  <div className={styles.skeletonTimelineDesc}></div>
                </div>
              </div>
              {/* Item 2 */}
              <div className={styles.skeletonTimelineItem}>
                <div className={styles.skeletonTimelineDot}>
                  <div className={styles.skeletonTimelineLine}>
                    <div className={styles.skeletonTimelineCircle}></div>
                  </div>
                </div>
                <div className={styles.skeletonTimelineContent}>
                  <div className={styles.skeletonTimelineDate}></div>
                  <div className={styles.skeletonTimelineTitle}></div>
                  <div className={styles.skeletonTimelineDesc}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Description */}
        <div className={styles.section}>
          <div className={styles.skeletonSectionTitle}></div>
          <div className={styles.skeletonDescription}>
            <div className={styles.skeletonDescLine}></div>
            <div className={styles.skeletonDescLine}></div>
            <div className={styles.skeletonDescLine}></div>
          </div>
        </div>
      </ContentWithTabs>
    </div>
  )
}

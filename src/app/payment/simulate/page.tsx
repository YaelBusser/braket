'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.scss'

export default function PaymentSimulationPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Simuler un délai de traitement
        setTimeout(() => {
            setLoading(false)
            setSuccess(true)

            // Confettis ou redirection après succès
            setTimeout(() => {
                router.push('/profile?payment=success')
            }, 3000)
        }, 2000)
    }

    if (success) {
        return (
            <div className={styles.container}>
                <div className={styles.successCard}>
                    <div className={styles.iconWrapper}>
                        <span className={styles.icon}>✅</span>
                    </div>
                    <h1 className={styles.title}>Paiement réussi !</h1>
                    <p className={styles.subtitle}>Merci pour votre confiance. Votre compte est désormais Premium.</p>
                    <p className={styles.redirectText}>Redirection en cours...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.paymentCard}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Finaliser la commande</h1>
                    <div className={styles.amount}>
                        <span className={styles.currency}>€</span>
                        <span className={styles.value}>9.99</span>
                        <span className={styles.period}>/ mois</span>
                    </div>
                    <p className={styles.planName}>Pack Organisateur Premium</p>
                </div>

                <form onSubmit={handlePayment} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Titulaire de la carte</label>
                        <input type="text" placeholder="John Doe" required className={styles.input} />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Numéro de carte</label>
                        <div className={styles.cardInputWrapper}>
                            <span className={styles.cardIcon}>💳</span>
                            <input type="text" placeholder="0000 0000 0000 0000" maxLength={19} required className={styles.input} />
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.formGroup}>
                            <label>Expiration</label>
                            <input type="text" placeholder="MM/YY" maxLength={5} required className={styles.input} />
                        </div>
                        <div className={styles.formGroup}>
                            <label>CVC</label>
                            <input type="text" placeholder="123" maxLength={3} required className={styles.input} />
                        </div>
                    </div>

                    <button type="submit" className={styles.payButton} disabled={loading}>
                        {loading ? (
                            <span className={styles.loader}></span>
                        ) : (
                            'Payer 9.99 €'
                        )}
                    </button>
                </form>

                <div className={styles.secureBadge}>
                    🔒 Paiement sécurisé et crypté
                </div>

                <Link href="/profile" className={styles.cancelLink}>
                    Annuler et retourner au profil
                </Link>
            </div>
        </div>
    )
}

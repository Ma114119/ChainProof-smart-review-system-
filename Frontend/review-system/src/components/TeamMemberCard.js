import React from 'react';

const TeamMemberCard = ({ name, role, bio, image, theme }) => {
    const styles = {
        card: {
            backgroundColor: theme.cardBg,
            color: theme.cardText,
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: `0 4px 6px ${theme.border}`,
            transition: 'all 0.3s ease',
            ':hover': {
                transform: 'translateY(-5px)',
                boxShadow: `0 10px 15px ${theme.border}`
            }
        },
        image: {
            width: '100%',
            height: '250px',
            objectFit: 'cover'
        },
        content: {
            padding: '1.5rem'
        },
        name: {
            fontSize: '1.3rem',
            fontWeight: '600',
            marginBottom: '0.5rem',
            color: theme.text
        },
        role: {
            fontSize: '1rem',
            color: theme.primary,
            marginBottom: '1rem'
        },
        bio: {
            fontSize: '0.95rem',
            lineHeight: '1.6',
            opacity: '0.8'
        }
    };

    return (
        <div style={styles.card}>
            <img src={image} alt={name} style={styles.image} />
            <div style={styles.content}>
                <h3 style={styles.name}>{name}</h3>
                <p style={styles.role}>{role}</p>
                <p style={styles.bio}>{bio}</p>
            </div>
        </div>
    );
};

export default TeamMemberCard;
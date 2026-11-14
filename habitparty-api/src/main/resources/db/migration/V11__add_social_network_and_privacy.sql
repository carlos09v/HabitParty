-- Rede de Amigos (Social v1.4) & Controles de Privacidade em users
ALTER TABLE users ADD COLUMN IF NOT EXISTS friend_code VARCHAR(12);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC';
ALTER TABLE users ADD COLUMN IF NOT EXISTS stats_visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC';
ALTER TABLE users ADD COLUMN IF NOT EXISTS achievements_visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC';
ALTER TABLE users ADD COLUMN IF NOT EXISTS friend_request_policy VARCHAR(25) NOT NULL DEFAULT 'EVERYONE';

DO $$
DECLARE
    rec RECORD;
    candidate VARCHAR(12);
    alphabet CONSTANT TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    i INT;
    pos INT;
BEGIN
    FOR rec IN SELECT user_id FROM users WHERE friend_code IS NULL LOOP
        LOOP
            candidate := 'HP-';
            FOR i IN 1..6 LOOP
                pos := 1 + floor(random() * length(alphabet))::INT;
                candidate := candidate || substr(alphabet, pos, 1);
            END LOOP;
            EXIT WHEN NOT EXISTS (SELECT 1 FROM users WHERE friend_code = candidate);
        END LOOP;
        UPDATE users SET friend_code = candidate WHERE user_id = rec.user_id;
    END LOOP;
END $$;

ALTER TABLE users ALTER COLUMN friend_code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_friend_code ON users(friend_code);

DO $$
BEGIN
    ALTER TABLE users ADD CONSTRAINT chk_users_profile_visibility
        CHECK (profile_visibility IN ('PUBLIC', 'FRIENDS_ONLY', 'PRIVATE'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE users ADD CONSTRAINT chk_users_stats_visibility
        CHECK (stats_visibility IN ('PUBLIC', 'FRIENDS_ONLY', 'PRIVATE'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE users ADD CONSTRAINT chk_users_achievements_visibility
        CHECK (achievements_visibility IN ('PUBLIC', 'FRIENDS_ONLY', 'PRIVATE'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE users ADD CONSTRAINT chk_users_friend_request_policy
        CHECK (friend_request_policy IN ('EVERYONE', 'FRIEND_CODE_ONLY', 'NONE'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Amizades e solicitações de amizade (par único independente de quem enviou)
CREATE TABLE IF NOT EXISTS friendships (
    friendship_id UUID PRIMARY KEY,
    requester_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    CONSTRAINT chk_friendships_distinct_users CHECK (requester_id <> addressee_id),
    CONSTRAINT chk_friendships_status CHECK (status IN ('PENDING', 'ACCEPTED', 'BLOCKED'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_friendships_user_pair
    ON friendships (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));

CREATE INDEX IF NOT EXISTS idx_friendships_requester_status
    ON friendships (requester_id, status);

CREATE INDEX IF NOT EXISTS idx_friendships_addressee_status
    ON friendships (addressee_id, status);

-- Notificações sociais persistidas (pedidos, aceites, marcos de amigos)
CREATE TABLE IF NOT EXISTS social_notifications (
    notification_id UUID PRIMARY KEY,
    recipient_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    actor_id UUID NULL REFERENCES users(user_id) ON DELETE CASCADE,
    notification_type VARCHAR(40) NOT NULL,
    reference_id UUID NULL,
    payload VARCHAR(500) NULL,
    is_seen BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_social_notifications_type CHECK (
        notification_type IN (
            'FRIEND_REQUEST_RECEIVED',
            'FRIEND_REQUEST_ACCEPTED',
            'FRIEND_MILESTONE_LEVEL',
            'FRIEND_MILESTONE_ACHIEVEMENT'
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_social_notifications_recipient_created
    ON social_notifications (recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_notifications_recipient_unseen
    ON social_notifications (recipient_id, is_seen)
    WHERE is_seen = FALSE;

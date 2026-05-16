/**
 * Account switcher storage — up to 10 saved sessions (email + token).
 * Token = serialized user session object (same shape as a2z_user).
 */
(function (global) {
    const ACCOUNTS_KEY = 'a2z_accounts';
    const ACTIVE_KEY = 'a2z_active_account';
    const LEGACY_USER_KEY = 'a2z_user';
    const MAX_ACCOUNTS = 10;

    function parseJson(raw, fallback) {
        if (!raw) return fallback;
        try {
            return JSON.parse(raw);
        } catch (e) {
            return fallback;
        }
    }

    function normalizeEmail(email) {
        return (email || '').trim().toLowerCase();
    }

    function getAccounts() {
        const list = parseJson(localStorage.getItem(ACCOUNTS_KEY), []);
        return Array.isArray(list) ? list : [];
    }

    function saveAccounts(accounts) {
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts.slice(0, MAX_ACCOUNTS)));
    }

    function getActiveEmail() {
        return normalizeEmail(localStorage.getItem(ACTIVE_KEY) || '');
    }

    function setActiveEmail(email) {
        localStorage.setItem(ACTIVE_KEY, normalizeEmail(email));
    }

    function tokenFromUser(user) {
        return typeof user === 'string' ? user : JSON.stringify(user);
    }

    function userFromToken(token) {
        if (!token) return null;
        if (typeof token === 'object') return token;
        return parseJson(token, null);
    }

    function addOrUpdateAccount(email, userOrToken) {
        const norm = normalizeEmail(email);
        if (!norm) return getAccounts();

        const token = tokenFromUser(userOrToken);
        let accounts = getAccounts().filter(a => normalizeEmail(a.email) !== norm);
        accounts.unshift({ email: norm, token });
        if (accounts.length > MAX_ACCOUNTS) accounts = accounts.slice(0, MAX_ACCOUNTS);
        saveAccounts(accounts);
        return accounts;
    }

    function getAccountByEmail(email) {
        const norm = normalizeEmail(email);
        return getAccounts().find(a => normalizeEmail(a.email) === norm) || null;
    }

    function setActiveSession(user) {
        if (!user || !user.email_address) return;
        const email = normalizeEmail(user.email_address);
        addOrUpdateAccount(email, user);
        setActiveEmail(email);
        localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(user));
    }

    function getActiveUser() {
        const activeEmail = getActiveEmail();
        const legacy = parseJson(localStorage.getItem(LEGACY_USER_KEY), null);
        if (legacy && activeEmail && normalizeEmail(legacy.email_address) === activeEmail) {
            return legacy;
        }
        if (activeEmail) {
            const acc = getAccountByEmail(activeEmail);
            const user = acc ? userFromToken(acc.token) : null;
            if (user) return user;
        }
        return legacy;
    }

    function removeAccount(email) {
        const norm = normalizeEmail(email);
        const accounts = getAccounts().filter(a => normalizeEmail(a.email) !== norm);
        saveAccounts(accounts);
        if (getActiveEmail() === norm) {
            localStorage.removeItem(ACTIVE_KEY);
            localStorage.removeItem(LEGACY_USER_KEY);
        }
    }

    function migrateFromLegacyUser() {
        const legacy = parseJson(localStorage.getItem(LEGACY_USER_KEY), null);
        if (legacy && legacy.email_address) {
            addOrUpdateAccount(legacy.email_address, legacy);
            if (!getActiveEmail()) setActiveEmail(legacy.email_address);
        }
        return getAccounts();
    }

    const AccountStore = {
        ACCOUNTS_KEY,
        ACTIVE_KEY,
        LEGACY_USER_KEY,
        MAX_ACCOUNTS,
        getAccounts,
        saveAccounts,
        getActiveEmail,
        setActiveEmail,
        addOrUpdateAccount,
        getAccountByEmail,
        setActiveSession,
        getActiveUser,
        removeAccount,
        migrateFromLegacyUser,
        userFromToken,
        normalizeEmail
    };

    global.AccountStore = AccountStore;
})(typeof window !== 'undefined' ? window : global);

// utiltiy local storage
export const setTokenAndUser = (token, user, expiresInMs) => {
  const now = new Date();
  const expiryTime = now.getTime() + expiresInMs;

  localStorage.setItem('token', token);
  localStorage.setItem('tokenExpiry', expiryTime);

  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    console.error('User is undefined. Cannot store in localStorage.');
  }
};

export const getUser = () => {
  if (typeof window !== 'undefined') {
    const user = window.localStorage.getItem('user');
    if (user) {
      try {
        return JSON.parse(user);
      } catch (error) {
        console.error('Error parsing user JSON:', error);
        return null;
      }
    }
  }
  return null;
};

export const getOrganization = () => {
  if (typeof window !== 'undefined') {
    const organization = window.localStorage.getItem('organization');
    if (organization) {
      try {
        return JSON.parse(organization);
      } catch (error) {
        console.error('Error parsing organization JSON:', error);
        return null;
      }
    }
  }
  return null;
};

export const getOrganizationId = () => {
  if (typeof window !== 'undefined') {
    const organization = window.localStorage.getItem('organization');
    if (organization) {
      try {
        const org = JSON.parse(organization);
        const orgId = org.organization.id;
        return orgId;
      } catch (error) {
        console.error('Error parsing organization JSON:', error);
        return null;
      }
    }
  }
  return null;
};

export const getInterworkyAssistantId = () => {
  if (typeof window !== 'undefined') {
    const assistantId = window.localStorage.getItem('interworky-assistant-id');
    return assistantId;
  }
  return null;
};

export const removeTokenAndUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('tokenExpiry');
  localStorage.removeItem('user');
};
export const removeOrg = () => {
  localStorage.removeItem('organization');
};

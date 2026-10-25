// Where the save lives in the browser (later: Steam cloud via Electron).
export const SAVE = {
  key: 'seoul-nightwatch.save',
  badSuffix: '.bad', // an unreadable save is kept under key + this, never silently overwritten
} as const;

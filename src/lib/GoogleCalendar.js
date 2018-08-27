

export default class GoogleCalendar {

  constructor(gapi, calendarId) {
    if (!gapi || !calendarId) {
      throw new Error('gapi and calendarId are mandatory');
    }
    this.gapi = gapi;
    this.calendarId = calendarId;
  }
}

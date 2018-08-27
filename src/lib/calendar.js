import moment from 'moment-timezone';

export const insertPasses = (gapi, calendarId, daypass, dates) => {
  const insertPromises = dates.map(date => insertPass(gapi, calendarId, daypass, date));
  return Promise.all(insertPromises);
}


export const insertPass = (gapi, calendarId, daypass, date) => {
  const start = daypass ? moment(date).hour(7).minute(0) : moment(date).hour(13).minute(0);
  const end = daypass ? moment(date).hour(15).minute(30) : moment(date).hour(21).minute(30);

  const event = {
    'summary': 'Ming jobbar',
    'location': 'Huddinge sjukhus',
    'description': 'Ming jobbar',
    'start': {
      'dateTime': start.toISOString(),
      'timeZone': moment.tz.guess()
    },
    'end': {
      'dateTime': end.toISOString(),
      'timeZone': moment.tz.guess()
    },
    'attendees': [
      {'email': 'ming.fondberg@gmail.com'},
    ],
    'reminders': {
      'useDefault': false
    }
  };

  // console.log(`inserting event in ${calendarId} for daypass:${daypass} :`, event);

  const request = gapi.client.calendar.events.insert({
    'calendarId': calendarId,
    'resource': event
  });

  return request;
}

export const deleteEvents = (gapi, calendarId, eventIds) => {
  const deletePromises = eventIds.map(eventId => deleteEvent(gapi, calendarId, eventId));
  return Promise.all(deletePromises);
}

export const deleteEvent = (gapi, calendarId, eventId) => {
  const params = {
    calendarId: calendarId,
    eventId: eventId,
  };

  return gapi.client.calendar.events.delete(params);
}

export const getEventsForMonth = (gapi, calendarId, monthDate) => {
  const startDate = moment(monthDate).add(1, 'days').startOf('month');
  const endDate = moment(monthDate).add(1, 'days').endOf('month');

  const listOptions = {
    'calendarId': calendarId,
    'timeMin': startDate.toISOString(),
    'timeMax': endDate.toISOString(),
    'showDeleted': false,
    'singleEvents': true,
    'maxResults': 100,
    'orderBy': 'startTime'
  };

  console.log('getEventsForMonth:', startDate.toISOString() + ' till ', endDate.toISOString());
  return gapi.client.calendar.events.list(listOptions);
}

export const getCalendars = (gapi) => {
  return gapi.client.calendar.calendarList.list({
    maxResults: 250,
    minAccessRole: 'writer',
  })
}

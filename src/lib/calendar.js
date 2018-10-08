import moment from 'moment-timezone';

// const retryWithBackoff = async (func, delayMs = 10, retries = 3) => {
//   const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
//   let result;
//   console.log('retryWithBackoff:', typeof func);
//
//   for (let i = 1; i <= retries; ++i) {
//     try {
//       result = await func();
//       console.log('Success:', i, delayMs);
//       break;
//     } catch (err) {
//       delayMs = delayMs * 2;
//       console.log('Failure:', i, delayMs);
//       if (i == retries) {
//         console.log('Maxed retries rethrowing error:', err);
//         throw err;
//       }
//       await wait(delayMs);
//     }
//   }
//   return result;
// }



/*
* Process the input array or functions or promises in parallel, limited by
* the concurrencyLimit and a pause of delayMs before execution of the funcs/promises
* */
function mapLimit(funcsOrPromises, concurrencyLimit, delayMs) {
  // Store the return values for the funcs or promises in order
  const results = [];

  // First create the buckets with the promise chains
  const chunkedFuncs = funcsOrPromises.reduce((promises, item, index) => {
    const bucket = index % concurrencyLimit;
    let chain = promises[bucket];
    if (!chain) {
      chain = promises[bucket] = Promise.resolve();
    }

    promises[bucket] = chain.then(_ => new Promise(resolve => {
      setTimeout(_ => {
        // Some promises meet the spec but are not instances of Promise
        if(item instanceof Promise || typeof item.then === 'function') {
          item.then(promiseRes => {
            results[index] = promiseRes;
            resolve();
          });
        } else if( typeof item === 'function') {
          results[index] = item();
          resolve();
        } else {
          throw new Error('Item must be either a Promise or a function');
        }

      }, delayMs);
    }));
    return promises;
  }, []);

  // Get the inner chains for the buckets
  const chunkedFuncsMapped = chunkedFuncs.map(chain => chain.then(res => res));
  // Run the chains in parallel anbd return the aggregated results
  return Promise.all(chunkedFuncsMapped).then(_ => results);
}


export const insertPasses = (gapi, calendarId, daypass, dates, settings) => {
  const insertPromises = dates.map(date => insertPass(gapi, calendarId, daypass, date, settings));
  return mapLimit(insertPromises, 2, 50);
}
export const deleteEvents = (gapi, calendarId, eventIds) => {
  const deletePromises = eventIds.map(eventId => deleteEvent(gapi, calendarId, eventId));
  return mapLimit(deletePromises, 2, 50);
}


const getHourMinute = (time) => {
  const splitted = time.split(':');
  return {
    hour: parseInt(splitted[0], 10),
    min:  parseInt(splitted[1], 10)
  }
}

export const insertPass = (gapi, calendarId, daypass, date, settings) => {
  const dayStart = getHourMinute(settings.daypass.start);
  const dayEnd = getHourMinute(settings.daypass.end);
  const evStart = getHourMinute(settings.eveningpass.start);
  const evEnd = getHourMinute(settings.eveningpass.end);
  // console.log(dayStart, dayEnd, evStart, evEnd);

  console.log('inserPass:', settings);

  const start = daypass
    ? moment(date).hour(dayStart.hour).minute(dayStart.min)
    : moment(date).hour(evStart.hour).minute(evStart.min);

  const end = daypass
    ? moment(date).hour(dayEnd.hour).minute(dayEnd.min)
    : moment(date).hour(evEnd.hour).minute(evEnd.min);

  const event = {
    'summary': settings.eventText,
    'location': 'Huddinge sjukhus',
    'description': settings.eventText + '\n--- Easy Scheduler ---',
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

  const request = gapi.client.calendar.events.insert({
    'calendarId': calendarId,
    'resource': event
  });

  return request;
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

  return gapi.client.calendar.events.list(listOptions)
    .then(response => {
      return response.result.items.filter(event => event.description && event.description.includes('--- Easy Scheduler ---'));
    })
}

export const getCalendars = (gapi) => {
  return gapi.client.calendar.calendarList.list({
    maxResults: 250,
    minAccessRole: 'writer',
  })
}

import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

import moment from 'moment-timezone';
import 'moment/locale/sv';

import DayPicker, { DateUtils } from 'react-day-picker';
import MomentLocaleUtils from 'react-day-picker/moment';
import { AlertDialog, Button, List, ListHeader, ProgressBar } from 'react-onsenui';

import { deleteEvents, insertPasses, getEventsForMonth, getOtherEventsForMonth } from '../lib/calendar';
import { withGoogleApi } from '../GoogleApiContext';
import DatePickerStyles from './DatePickerStyles';
import './daypicker-style.css';

class DatePicker extends Component {
  static propTypes = {
    gapi: PropTypes.object.isRequired,
    easySchedulerModel: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    const date = new Date();

    this.state = {
      loading: true,
      alertDialogShown: false,
      currentMonth: new Date(date.getFullYear(), date.getMonth(), 1),
      selectedDays: [],
      daypasses: [],
      eveningpasses: [],
      events: [],
      settings: {},
      addPassMode: false,
      selectedDay: date,
      otherEvents: [],
    };
  }

  // Helpers
  removeDaysFromArray = (dayArray, days2remove) => {
    return dayArray.filter(day => {
      const foundIdx = days2remove.findIndex(removeDay => DateUtils.isSameDay(removeDay, day));
      return foundIdx === -1;
    });
  };

  handleMonthChange = newmonth => {
    this.fetchPassesFromServer(newmonth);
  };

  componentDidUpdate(nextProps, prevState) {
    if (prevState.settings.calendarId !== this.state.settings.calendarId) {
      this.fetchPassesFromServer();
    }
  }

  componentWillMount() {
    const locale = window.navigator.userLanguage || window.navigator.language;
    console.log('pelle:', locale);
    this.setState({ settings: this.props.easySchedulerModel.getSettings() }, () => this.fetchPassesFromServer());
  }

  fetchPassesFromServer = monthToFetch => {
    this.setState({ loading: true });
    if (!monthToFetch) {
      monthToFetch = this.state.currentMonth;
    }

    if (monthToFetch.getMonth() !== this.state.currentMonth.getMonth()) {
      this.setState({ currentMonth: monthToFetch });
    }

    getEventsForMonth(this.props.gapi, this.state.settings.calendarId, monthToFetch).then(events => {
      const daypasses = events
        .filter(event => moment(event.start.dateTime).hour() < 8)
        .map(event => moment(event.start.dateTime).toDate());
      const eveningpasses = events
        .filter(event => moment(event.start.dateTime).hour() > 8)
        .map(event => moment(event.start.dateTime).toDate());
      this.setState({
        loading: false,
        events,
        daypasses,
        eveningpasses,
        selectedDays: [],
      });
    });

    getOtherEventsForMonth(this.props.gapi, this.state.settings.calendarId, monthToFetch).then(events =>
      this.setState({ otherEvents: events })
    );
  };

  // DayPicker functions
  handleDayClick = (day, { selected }) => {
    const { addPassMode, selectedDays } = this.state;
    if (!addPassMode) {
      this.setState({ selectedDays: [], selectedDay: day });
      return;
    }

    if (selected) {
      const selectedIndex = selectedDays.findIndex(selectedDay => DateUtils.isSameDay(selectedDay, day));
      selectedDays.splice(selectedIndex, 1);
    } else {
      selectedDays.push(day);
    }
    this.setState({ selectedDays, selectedDay: day });
  };

  // ============================
  // Biz logic methods

  addPasses = dayPass => () => {
    this.setState({ loading: true });

    // filter out already inserted days
    const passesToAdd = this.removeDaysFromArray(
      this.state.selectedDays,
      dayPass ? this.state.daypasses : this.state.eveningpasses
    );

    insertPasses(this.props.gapi, this.state.settings.calendarId, dayPass, passesToAdd, this.state.settings)
      .then(res => this.fetchPassesFromServer())
      .catch(e => {
        this.setState({ alertDialogShown: true }, () => setTimeout(this.fetchPassesFromServer, 500));
      });
  };

  clearDays = () => {
    const { events, selectedDays } = this.state;
    this.setState({ loading: true });

    const eventIdsToDelete = [];
    events.forEach(event => {
      const dayToRemove = selectedDays.find(date => {
        return DateUtils.isSameDay(date, moment(event.start.dateTime).toDate());
      });
      if (dayToRemove) {
        eventIdsToDelete.push(event.id);
      }
    });

    deleteEvents(this.props.gapi, this.state.settings.calendarId, eventIdsToDelete)
      .then(res => this.fetchPassesFromServer())
      .catch(e => {
        console.log(e);
        this.setState({ alertDialogShown: true }, () => setTimeout(this.fetchPassesFromServer, 500));
      });
  };

  render() {
    const {
      loading,
      currentMonth,
      daypasses,
      eveningpasses,
      selectedDays,
      otherEvents,
      addPassMode,
      selectedDay,
    } = this.state;

    const selectedDaysEvents = otherEvents
      .filter(event => DateUtils.isSameDay(selectedDay, moment(event.start.dateTime).toDate()))
      .map(event => {
        const start = moment(event.start.dateTime).format('HH:mm');
        const end = moment(event.end.dateTime).format('HH:mm');
        return start + ' - ' + end + '  ' + event.summary;
      });
    //    console.log('Here:', selectedDaysEvents);

    return (
      <Fragment>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
          {loading && <ProgressBar style={{ width: '100%' }} indeterminate />}

          <DayPicker
            showWeekNumbers
            localeUtils={MomentLocaleUtils}
            locale="sv"
            month={currentMonth}
            className="SchemaChooser"
            onDayClick={this.handleDayClick}
            onMonthChange={this.handleMonthChange}
            selectedDays={selectedDays}
            modifiers={{ daypasses, eveningpasses }}
          />
          <div>
            <DatePickerStyles
              daypassColor={this.state.settings.daypass.color}
              eveningpassColor={this.state.settings.eveningpass.color}
            />
            {addPassMode && (
              <Fragment>
                <div>
                  <button
                    className="passButton daypassesButton"
                    disabled={!selectedDays.length}
                    onClick={this.addPasses(true)}>
                    Dagpass
                  </button>
                  <button
                    className="passButton eveningpassesButton"
                    disabled={!selectedDays.length}
                    onClick={this.addPasses(false)}>
                    Kvällspass
                  </button>
                  <button
                    className="passButton removepassesButton"
                    disabled={!selectedDays.length}
                    onClick={this.clearDays}>
                    Rensa
                  </button>
                </div>
              </Fragment>
            )}

            {!addPassMode && (
              <Fragment>
                <div
                  style={{
                    width: '80vw',
                    height: '27vh',
                    overflow: 'scroll',
                  }}>
                  <List
                    dataSource={selectedDaysEvents}
                    renderRow={(row, index) => {
                      return (
                        <div key={index} className="ons-list-item-fixed">
                          {row}
                        </div>
                      );
                    }}
                    renderHeader={() => (
                      <ListHeader modifier="material">{moment(selectedDay).format('dddd D MMMM')}</ListHeader>
                    )}
                  />
                </div>
              </Fragment>
            )}
          </div>

          <div className="bottomButtonContainer">
            <button
              className="passButton addPassesButton"
              onClick={() => this.setState({ addPassMode: !addPassMode, selectedDays: [] })}>
              {addPassMode ? 'Klar' : 'Lägg till pass'}
            </button>
          </div>
        </div>

        <AlertDialog isOpen={this.state.alertDialogShown} isCancelable={false}>
          <div className="alert-dialog-title">Warning!</div>
          <div className="alert-dialog-content">
            Alla pass kunde inte sparas. <br />
            Prova en gång till.
          </div>
          <div className="alert-dialog-footer">
            <Button
              onClick={() => {
                this.fetchPassesFromServer();
                this.setState({ alertDialogShown: false });
              }}
              className="alert-dialog-button">
              Ok
            </Button>
          </div>
        </AlertDialog>
      </Fragment>
    );
  }
}

export default withGoogleApi(DatePicker);

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {
  Button, Icon,
  Input,
  Select
} from 'react-onsenui';

import { withGoogleApi } from '../GoogleApiContext';

class Settings extends Component {
  static propTypes = {
    easySchedulerModel: PropTypes.object.isRequired,
  };

  state = {
    eventText: '',
    calendarId: '',
    calendars: [],
    daypass: {
      start: '',
      end: '',
      color: ''
    },
    eveningpass: {
      start: '',
      end: '',
      color: ''
    },
  }

  init = () => {
    const calendars = this.props.easySchedulerModel.getCalendars();
    const settings = this.props.easySchedulerModel.getSettings();
    this.setState(
      {
        calendars: calendars,
        eventText: settings.eventText,
        calendarId: settings.calendarId || '',
        daypass: { ...settings.daypass },
        eveningpass: { ...settings.eveningpass }
      }
    );

  }

  componentWillMount() {
    this.init();
  }

  componentDidUpdate(nextProps) {
    if(nextProps.active !== this.props.active) {
      this.init();
    }
  }

  saveSettings = () => {
    const { calendars, ...settings } = this.state;
    this.props.easySchedulerModel.saveSettings(settings);
  }

  handleEvent = (stateKey, subKey) => (event) => {
    this.setState({
        [stateKey]: Object.assign({}, this.state[stateKey], {[subKey]: event.target.value})
      })
  }

  render() {
    return (
      <div style={{ padding: 20, textAlign: 'left' }}>
        <div style={{ position: 'relative' }}>
          <span className="text-input__label text-input--material__label--active text-input--material__label">
            Välj kalender
          </span>
          <Select style={{ width: '100%' }}
                  value={this.state.calendarId}
                  modifier="material"
                  onChange={(event) => { this.setState({calendarId: event.target.value}) }}>
            <option value="" disabled></option>
             {this.state.calendars.map(calendar =>
               <option key={calendar.id} value={calendar.id}>{calendar.summary}</option>
             )}
          </Select>
        </div>
        <div style={{ position: 'relative',marginTop: '50px' }}>
          <span className="text-input__label text-input--material__label--active text-input--material__label">
            Dagpass tider
          </span>
          <input
            style={{ width: '45%' }}
            className="text-input text-input--material"
            value={this.state.daypass.start}
            onChange={this.handleEvent('daypass', 'start')}
            type="time"/>
          <span>-&nbsp;&nbsp;</span>
          <input
            style={{ width: '45%' }}
            className="text-input text-input--material"
            value={this.state.daypass.end}
            onChange={this.handleEvent('daypass', 'end')}
            type="time"/>
        </div>
        <div style={{ position: 'relative',marginTop: '50px' }}>
          <span className="text-input__label text-input--material__label--active text-input--material__label">
            Kvällspass tider
          </span>
          <input
            style={{ width: '45%' }}
            className="text-input text-input--material"
            value={this.state.eveningpass.start}
            onChange={this.handleEvent('eveningpass', 'start')}
            type="time"/>
          <span>-&nbsp;&nbsp;</span>
          <input
            style={{ width: '45%' }}
            className="text-input text-input--material"
            value={this.state.eveningpass.end}
            onChange={this.handleEvent('eveningpass', 'end')}
            type="time"/>
        </div>
        <Input
          style={{ width: '100%', marginTop: '50px' }}
          value={this.state.eventText}
          onChange={(event) => { this.setState({eventText: event.target.value})} }
          modifier='material'
          float
          placeholder='Kalenderns händelsetext' />

        <div className="bottom">
          <Button modifier='large'
                  onClick={this.saveSettings}>
            Spara inställningar <Icon icon="md-edit" />
          </Button>

          <Button modifier='large--quiet'
                  onClick={this.props.easySchedulerModel.signOut}>
            Logga ut <Icon icon='md-sign-in' />
          </Button>
        </div>
      </div>
    );
  }
}

export default withGoogleApi(Settings);

import React, { Component } from 'react';
import PropTypes from 'prop-types';


class Calendars extends Component {
  static propTypes = {
    onCalendarSelected: PropTypes.func.isRequired,
    calendars: PropTypes.array.isRequired
  };

  render() {
    const { calendars, onCalendarSelected } = this.props;
    return (
      <div>
        <h3>Välj kalender</h3>
        {calendars.map(calendar =>
          <button key={calendar.id} onClick={() => onCalendarSelected(calendar)}>{calendar.summary}</button>
        )}
      </div>
    );
  }
}

export default Calendars;


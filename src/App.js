import React from 'react';
import 'onsenui/css/onsenui.css';
import 'onsenui/css/onsen-css-components.css';
import {
  Page,
  Tab,
  Tabbar,
  Toolbar
} from 'react-onsenui';

import EasyScheduler from './EasyScheduler';

class MyTab extends React.Component {
  render() {
    return (
      <Page>
        <section style={{margin: '16px'}}>
          {this.props.children}.
        </section>
      </Page>
    );
  }
}



export default class AppTabs extends React.Component {
  state = {
    index: 0
  };

  renderToolbar = () => {
    const titles = ['Schedule', 'Settings'];
    return (
      <Toolbar>
        <div className='center'>{titles[this.state.index]}</div>
      </Toolbar>
    );
  }

  renderTabs = () => {
    return [
      {
        content: <MyTab key="Schedule-c"><EasyScheduler /></MyTab> ,
        tab: <Tab key="Schedule-t" label='Schedule' icon='md-calendar' />
      },
      {
        content: <MyTab key="Settings-c"><span>Settings here</span></MyTab>,
        tab: <Tab key="Settings-t" label='Settings' icon='md-settings' />
      }
    ];
  }

  render() {
    return (
      <Page renderToolbar={this.renderToolbar}
            contentStyle={{ backgroundColor: 'red' }}>
        <Tabbar
          swipeable={false}
          position='auto'
          index={this.state.index}
          onPreChange={(event) => {
              if (event.index !== this.state.index) {
                this.setState({index: event.index});
              }
            }
          }
          renderTabs={this.renderTabs}
        />
      </Page>
    );
  }
}

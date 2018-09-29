import React from 'react';

export default class App extends React.Component {



  render() {

    return (
      <div><pre>{
        JSON.stringify([1,2,3,4,5,6], null , 2)
      }</pre></div>
    );
  }
}

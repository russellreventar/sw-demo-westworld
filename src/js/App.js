import React from 'react';
import ReactDOM from 'react-dom';
import Axios from 'axios';

require('./../css/style.css');

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      fetching: true,
      currentBandit: 0,
      currentTarget: null,
      entered: false,
      bandits: []
    }
  }

  componentDidMount() {
    this.getBandits();
  }

  getBandits() {
    this.setState({fetching: true});
    Axios.get('/bandits')
      .then(res => {
        this.setState({bandits: res.data, fetching: false});
      })
  }

  putBanditStatus(id, isCaptured) {

    const url = `/status/${id}?isCaptured=${isCaptured}`;

    if(navigator.onLine) {
      this.setState({fetching: true});
      Axios.put(url)
        .then(res => {
          this.getBandits();
        })
    }else {
      navigator.serviceWorker.controller.postMessage({type: 'sync', url, options: { method:'PUT'}})
    }
  }

  enterApp() {
    this.setState({entered: true});
  }
  next() {
    this.setState({currentBandit: this.state.currentBandit + 1})
  }
  previous() {
    this.setState({currentBandit: this.state.currentBandit - 1})
  }

  render() {
    const { fetching, entered, bandits, currentBandit, currentTarget } = this.state;
    const bandit = bandits[currentBandit];

    return (
      <div className="app">
        {(fetching || !entered) ?
          <div className="loading">
            <img className="logo" src={'./src/imgs/logo.png'}/>
            { fetching ? <img className="spinner" src={'./src/imgs/spinner.png'}/> : null }
            <h4>
              {
                fetching ? "Loading Wanted List"
                :
                <div className="enter" onClick={this.enterApp.bind(this)}> Enter </div>
              }
            </h4>
          </div> :
          bandits.length > 0 ?
            <div className="wanted">
              <img onClick={this.getBandits.bind(this)} className="logo-small" src={'./src/imgs/logo.png'}/>
              <h1> MOST WANTED </h1>
              <div className="bandit">
                <div className="poster">
                  {bandit.captured ? <div className="captured">CAPTURED</div> : null}
                  <img src={ bandit.poster }/>
                </div>
                <h2>{bandit.firstName} <span className="nickname"> "{bandit.nickName}"</span> {bandit.lastName}</h2>
                <p>{bandit.description}</p>
                <div className="seperator"></div>
                <div className="reward">
                  <h3>REWARD</h3>
                  <span className="reward-amount">
                    {bandit.captured ? <strike>{ bandit.reward }</strike> : bandit.reward}
                  </span>
                  <h3 className="red">Dead or Alive</h3>
                </div>
              </div>
              <div>
                {
                  currentBandit > 0 ?
                    <button className="previous" onClick={()=>this.previous()}>{'<'}</button> : null
                }
                <div className="mark-as">
                  <a onClick={() => this.putBanditStatus(bandit.id, !bandit.captured)}>
                    {bandit.captured ? 'Mark As Escaped' :'Mark As Captured'}
                  </a>
                </div>
                {
                  currentBandit < (bandits.length-1) ? <button className="next" onClick={()=>this.next()}>{'>'}</button> : null
                }
              </div>
            </div>
            : null
        }
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('app'));

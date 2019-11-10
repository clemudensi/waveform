import React, { Component } from 'react';
import ReactHowler from 'react-howler';
import PropTypes from 'prop-types';
import axios from 'axios';
import Waveform from 'react-audio-waveform';
import { Tooltip, Button, Input, Icon } from 'antd';
import { PlayButton, Progress, Timer } from 'react-soundplayer/components';
import { DEFAULT_DURATION, DEFAULT_MP3} from "./constants";

class AudioPlayer extends Component {
    constructor(props) {
        super(props);
        this.myRef = React.createRef();
        this.state = {
            playing: false,
            currentTime: 0,
            speedup: false,
            loadErr: false,
            addTag: false,
            tagValue: '',
            error: '',
            tags: [],
            wave_width: 0,
        };
    }

    seek(secs, play) {
        if (secs && secs.seek != null) secs = secs.seek();
        this.player.seek(secs);
        let toSet = { currentTime: secs };
        if (play === true) toSet.playing = true;
        this.setState(toSet);
    }

    toggleRate() {
        let { speedup } = this.state;
        speedup = !speedup;
        this.setState({ speedup });
        this.player._howler.rate(speedup ? 2.0 : 1.0);
    }

    getState() {
        let { playing, currentTime } = this.state;
        return { playing, currentTime };
    }

    handleChange = e => {
        e.preventDefault();
        this.setState({ tagValue: e.target.value});
    };

    getSeek() {
        if (this.playerInterval) clearInterval(this.playerInterval);
        this.playerInterval = setInterval(() => {
            let { mp3url } = this.props;
            if (this.player) {
                let currentTime = this.player.seek();
                const duration = mp3url === DEFAULT_MP3 ? DEFAULT_DURATION : this.player.duration();
                const toSet = { currentTime };
                if (!this.state.duration && duration != null) {
                    toSet.duration = duration;
                }
                if (duration != null) toSet.loadErr = false;
                if (mp3url === DEFAULT_MP3 && currentTime >= DEFAULT_DURATION) {
                    this.player.stop();
                    toSet.playing = false;
                    currentTime = 0;
                }
                this.setState(toSet);
            }
        }, 250);
    }

    componentWillUnmount() {
        if (this.playerInterval) clearTimeout(this.playerInterval);
    }

    async componentDidMount() {
      await this.webAudio();
      this.getSeek();
        window.addEventListener('resize', this.updateDimensions);

    }

    componentDidUpdate(prevProps, prevState){
        if(prevState.inner_x !== this.state.inner_x){
            const wave_width = document.getElementById('container').clientWidth;
            this.setState({ wave_width })
        }
    }

    updateDimensions = () => {
        this.setState({ inner_x: window.innerWidth });
    };

    isObject(obj) {
        return obj instanceof Object || ((typeof obj === "object") && (obj !== null));
    }

   async webAudio(){
      const audio = (await axios.get(DEFAULT_MP3, {
        responseType: 'arraybuffer'
      })).data;
      console.log(new Uint32Array(audio));
      this.setState({ res: new Uint32Array(audio)});
    }

    addTag = () =>{
        const inner_x = window.innerWidth;
        const wave_width = document.getElementById('container').clientWidth;
        this.setState({addTag: true, wave_width, inner_x });
    };

   cancelTag = () => {
       this.setState({addTag: false});
   };

    createTag = () => {
        const { tags, tagValue, currentTime } = this.state;
        const timeline = `${Math.floor(currentTime/60)}:${currentTime%60}`;

        return tagValue.length > 0 ? (() => {
            tags.push({ time: timeline, comment: tagValue, currentTime });
            this.setState({ tagValue: '', addTag: false, error: ''});
        })() : this.setState({ error: 'Add a tag name'})
    };


    render() {
        const { mp3url } = this.props;
        let {
            playing, currentTime, duration, speedup,
            loadErr, addTag, tagValue, tags, wave_width
        } = this.state;

        if (this.isObject(currentTime)) currentTime = 0;

        if (mp3url === DEFAULT_MP3) duration = DEFAULT_DURATION;

        return (
          // AudioPlayer Starts
          <div className="ff-audio" ref={this.myRef}>
              {
                  this.state.error.length > 0 ?
                    <p className="tag-error">{this.state.error}</p> : null
              }

              {duration != null ?
                <div className="flex flex-center px2 relative z1">

                  {/*Play button starts*/}
                  <PlayButton
                    playing={playing}
                    onTogglePlay={() => this.setState({ playing: !playing })}
                    className="play-btn flex-none h2 mr2 button button-transparent button-grow rounded"
                  />
                  {/*Play button ends*/}

                  {/*Playing Speed starts*/}
                  <div className="sb-soundplayer-volume mr2 flex flex-center">
                      <button onClick={() => this.toggleRate()}
                              className="sb-soundplayer-btn sb-soundplayer-volume-btn
                              flex-none h2 button button-transparent button-grow rounded"
                      >
                          <img className={`speed-btn ${speedup ? 'audio-speedup' : ""}`} alt="speed-up"
                               src="/pane/speedup.svg"
                          />
                      </button>
                  </div>
                  {/*Playing Speed ends*/}


                  {/*WaveForm Container Starts*/}
                  <div
                        id="container"
                       className="wave-form flex-auto rounded sb-soundplayer-volume mr2 flex flex-center"
                       onDoubleClick={this.addTag}
                       // onMouseMove={this.seePoints}

                  >{tags.map((item, i) =>
                        <Tooltip placement="top" title={item.comment} key={i}>
                            <span className="dot" style={{ left: (wave_width * (item.currentTime/duration))}}/>
                        </Tooltip>)}

                      <Waveform
                        barWidth={1}
                        peaks={this.state.res}
                        height={30}
                        maxWidth="28vw"
                        width="28vw"
                        pos={currentTime}
                        duration={duration}
                        onClick={(ts) => this.seek(ts)}
                        color="rgba(167, 167, 167, 0.65)"
                        progressGradientColors={[[1, "#fff"], [1, "#fff"]]}
                        transitionDuration={300}
                      />
                  </div>
                  {/*WaveForm Container ends*/}

                  {/*Timer starts*/}
                  <Timer
                    className={"timer"}
                    duration={duration} // in seconds
                    currentTime={currentTime != null ? currentTime : 0} />
                    {/*Timer ends*/}

                </div> :
                    (loadErr ?
                      <div style={{ padding: "5 20px" }}>
                          Unable to load audio: {loadErr}
                      </div> :
                      <div className="progress">
                          <div className="indeterminate" />
                      </div>
                    )}

                {/*Stream Audio*/}
                <div>
                  <ReactHowler
                    src={mp3url}
                    playing={playing}
                    loop={false}
                    onLoadError={(id, err) => {
                        console.log('Unable to load media', err);
                        this.setState({ loadErr: (err && err.message) || 'Startup error' });
                    }}
                    onLoad={() => this.getSeek()}
                    ref={(ref) => (this.player = ref)}
                  />
                  {
                      addTag ?
                          <div className="add-tag">
                            <Input size="small"
                                   placeholder="add tag"
                                   onChange={this.handleChange}
                                   value={tagValue}
                            />
                            <Button
                                size="small"
                                onClick={this.cancelTag}
                            >
                                cancel
                            </Button>
                            <Button
                                size="small"
                                onClick={this.createTag}
                            >
                                add
                            </Button>
                          </div> : null
                  }
                </div>
          </div>
          // AudioPlayer Ends
        );
    }
}

AudioPlayer.propTypes = {
    mp3url: PropTypes.string.isRequired
};

export default AudioPlayer;

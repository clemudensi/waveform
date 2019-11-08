import React, { Component } from 'react';
import ReactHowler from 'react-howler';
import PropTypes from 'prop-types';
import axios from 'axios';
import Waveform from 'react-audio-waveform';
import { Tooltip, Button, Input } from 'antd';
import { PlayButton, Progress, Timer } from 'react-soundplayer/components';
import { DEFAULT_DURATION, DEFAULT_MP3} from "./constants";

class AudioPlayer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            playing: false,
            currentTime: 0,
            speedup: false,
            loadErr: false,
            addTag: false,
            tagValue: '',
            tags: []
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
    }

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

    addTag() {
        this.setState({addTag: true});
    }

   cancelTag = () => {
       this.setState({addTag: false});
   };

    createTag = (e) => {
        const { tags, tagValue, currentTime } = this.state;
        const x_axis = e.clientX - e.target.offsetWidth;
        const y_axis = e.clientY - e.target.offsetHeight;
        tags.push({ time: currentTime, comment: tagValue, x_axis, y_axis });
        this.setState({ tagValue: '', addTag: false});
    };

    render() {
        const { mp3url } = this.props;
        let { playing, currentTime, duration, speedup, loadErr, addTag, tagValue, tags } = this.state;
        if (this.isObject(currentTime)) currentTime = 0;
        if (mp3url === DEFAULT_MP3) duration = DEFAULT_DURATION;
        return (
          <div className="ff-audio">
              {duration != null ?
                <div className="flex flex-center px2 relative z1">

                  {/*Play button*/}
                  {/*  {tags.map(item => */}
                  {/*    <div style={{ left: item.x_axis, top: item.y_axis, position:'absolute'}}>*/}
                  {/*        {item.comment}*/}
                  {/*    </div>)*/}
                  {/*  }*/}
                  <PlayButton
                    playing={playing}
                    onTogglePlay={() => this.setState({ playing: !playing })}
                    className="flex-none h2 mr2 button button-transparent button-grow rounded"
                  />

                  {/*Playing Speed*/}
                  <div className="sb-soundplayer-volume mr2 flex flex-center">
                      <button onClick={() => this.toggleRate()}
                              className="sb-soundplayer-btn sb-soundplayer-volume-btn
                              flex-none h2 button button-transparent button-grow rounded"
                      >
                          <img className={`speed-btn ${speedup ? 'audio-speedup' : ""}`} alt="speed-up"
                               src="/pane/speedup.svg" height={25}
                          />
                      </button>
                  </div>

                  {/*WaveForm Data*/}
                  <div
                       className="flex-auto wave-form rounded rounded-left"
                       onDoubleClick={()=> this.addTag()}

                  >
                      <Waveform
                        barWidth={1}
                        peaks={this.state.res}
                        height={35}
                        maxWidth={200}
                        width={200}
                        pos={currentTime}
                        duration={duration}
                        onClick={(ts) => this.seek(ts)}
                        color="#C0C0C0"
                        progressGradientColors={[[1, "#fff"], [1, "#fff"]]}
                        transitionDuration={300}
                      />
                  </div>

                  <Timer
                    className={"timer"}
                    duration={duration} // in seconds
                    currentTime={currentTime != null ? currentTime : 0} />
                </div> :
                (loadErr ?
                  <div style={{ padding: "5 20px" }}>
                      Unable to load audio: {loadErr}
                  </div> :
                  <div className="progress">
                      <div className="indeterminate" />
                  </div>)}

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
        );
    }
}

AudioPlayer.propTypes = {
    mp3url: PropTypes.string.isRequired
};

export default AudioPlayer;

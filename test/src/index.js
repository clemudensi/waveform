import React from 'react';
import ReactDOM from 'react-dom';
import { Tooltip } from 'antd'

import AudioPlayer from './AudioPlayer';
import {DEFAULT_MP3} from "./constants";
import 'antd/dist/antd.css';

const text = 'double click timeline to add tag';

ReactDOM.render(
  <Tooltip placement="topLeft" title={text}>
      <div className="audio-section">
          <AudioPlayer mp3url={DEFAULT_MP3} />
      </div>
  </Tooltip>, document.getElementById('root'));

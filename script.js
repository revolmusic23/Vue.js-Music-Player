new Vue({
  el: '#app',
  data: {
    playlist: [],
    currentTrack: '',
    googleDriveLink: '',
    isDragging: false,
    isPlaying: false,
    progress: 0,
    audioReady: false,
    currentTrackIndex: -1, // 初始為 -1，表示沒有播放任何曲目
    isTrackPlaying: false,
    currentTime: 0,
    duration: 0,
    isMuted: false,
    volume: 1,
    showVolumeSlider: false,
    previousVolume: 0.5,
    isRepeating: false,
    draggingItemIndex: -1,
    isLoopEnabled: false,
    showLoopSection: false,
    shouldUpdateProgressBar: false,
    loopStart: 0,
    loopEnd: 0,
    inputLoopStart: 0,
    inputLoopEnd: 0,
    playbackSpeed: "1",
    
    // MOBILE DEVICE
    isMobileDevice: false,
    isPlaylistVisible: false,
    isMobile: false
  },
  methods: {

    // -- DROP-AREA METHODS --
    handleDragOver(event) {
      this.isDragging = true;
    },

    handleDrop(event) {
      event.preventDefault();
      this.isDragging = false;

      const files = event.dataTransfer.files;
      if (files) {
        for (let i = 0; i < files.length; i++) {
          const fileType = files[i].name.split('.').pop().toLowerCase();
          const acceptedFormats = ['mp3', 'wav', 'ogg', 'aac', 'flac'];

          if (files[i].type.startsWith('audio/') && acceptedFormats.includes(fileType)) {
            this.addToPlaylist(files[i]);
          } else {
            console.warn('Skipped non-audio file:', files[i].name);
          }
        }
      }
    },

    handleDragLeave(event) {
      // Handle drag leave...
      event.preventDefault();
      this.isDragging = false;
    },

    // handleFiles(files) {
    //   for (let i = 0; i < files.length; i++) {
    //     const file = files[i];
    //     if (file.type.startsWith('audio/')) {
    //       this.addToPlaylist(file);
    //     }
    //   }
    // },

    triggerFileInput() {
      document.getElementById('file-input').click();
    },
    
    handleFileSelect(event) {
      const files = event.target.files;
      if (files) {
        for (let i = 0; i < files.length; i++) {
          this.addToPlaylist(files[i]);
        }
      }
      event.target.value = null;
    },

    // -- PLAYLIST & TRACK METHODS --
    addToPlaylist(file) {
      const fileType = file.name.split('.').pop().toLowerCase();
      const acceptedFormats = ['mp3', 'wav', 'ogg', 'aac', 'flac'];

      if (file.type.startsWith('audio/') && acceptedFormats.includes(fileType)) {
        let title = file.name;
        const url = URL.createObjectURL(file);
        const lastDotIndex = title.lastIndexOf('.');
    
        if (lastDotIndex > -1) {
          title = title.substring(0, lastDotIndex);
        }
        this.playlist.push({ title, url });

      } else {
        console.warn('File skipped (not a supported audio format):', file.name);
      }
      
      // this.playlist.push({ title: 'New Track', url: link });
    },

    importFromGoogleDrive() {
      let link = this.googleDriveLink;

      // 提取 FILE_ID
      const matches = link.match(/\/file\/d\/(.+?)\//);
      if (matches && matches[1]) {
          const fileID = matches[1];

          // 构造直接链接
          const directLink = `https://drive.google.com/uc?export=download&id=${fileID}`;

          // 将转换后的链接添加到播放列表
          this.addToPlaylist(directLink);
      } else {
          // 链接无效的处理逻辑...
          console.error("Invalid Google Drive link.");
      }
    },

    async playTrack(index) {
      // Play a track...
      if (this.$refs.audioPlayer) {
        await this.$refs.audioPlayer.pause();
        this.$refs.audioPlayer.currentTime = 0;
      }
  
      // 設定新的音樂資源
      this.currentTrack = this.playlist[index];
      this.$refs.audioPlayer.load();
  
      // 加載並播放新的音樂
      this.$refs.audioPlayer.play().then(() => {
        this.isPlaying = true; // 更新 isPlaying 為 true
      }).catch(error => {
        console.error('Error during playback:', error);
      });

      this.currentTrackIndex = index; // 更新當前播放曲目的索引
      this.isTrackPlaying = true; // 当歌曲开始播放时设置为 true
      this.resetLoopSpeed();
    },
  
    removeTrack(index) {
      console.log('Removing track at index:', index);
      const wasPlaying = index === this.currentTrackIndex;
      this.playlist.splice(index, 1);

      if (wasPlaying) {
        console.log('Removing currently playing track.');
          if (this.playlist.length > 0) {
              if (index === this.playlist.length) {
                  this.playTrack(0);
              } else {
                  this.playTrack(index);
              }
          }
          else { // 如果播放列表空了
              this.stopPlayback(); // 停止播放並重置播放器
          }
      } 
      else if (index < this.currentTrackIndex) {
          // 若刪除的歌曲在正在播放的歌曲前面
          this.currentTrackIndex--;
      }
    },

    stopPlayback() {
      const audioPlayer = this.$refs.audioPlayer;
          if (audioPlayer) {
              audioPlayer.pause();
              audioPlayer.currentTime = 0;
              audioPlayer.src = '';
          }
          this.currentTrack = null;
          this.isPlaying = false;
          this.duration = 0;
          this.isTrackPlaying = false;
    },

    // -- AUDIO CONTROLS METHODS --
    togglePlayPause() {
      if (this.$refs.audioPlayer) {
        if (this.$refs.audioPlayer.paused) {
          this.$refs.audioPlayer.play();
          this.isPlaying = true; // 更新 isPlaying 為 true
        } else {
          this.$refs.audioPlayer.pause();
          this.isPlaying = false; // 更新 isPlaying 為 false
        }
      }
    },

    playPrevious() {
      // Play previous track...
      if (this.playlist.length > 0) {
        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
        this.playTrack(this.currentTrackIndex);
      }
    },
  
    playNext() {
      // Play next track...
      if (this.playlist.length > 0) {
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        this.playTrack(this.currentTrackIndex);
      }
    },

    toggleRepeat() {
      if (this.isTrackPlaying) {
        this.isRepeating = !this.isRepeating;
        this.$refs.audioPlayer.loop = this.isRepeating; // 设置 audio 元素的循环播放属性
      }
    },

    seekBackward() {
      if (this.$refs.audioPlayer.currentTime >= 5) {
        this.$refs.audioPlayer.currentTime -= 5;
      } else {
        this.$refs.audioPlayer.currentTime = 0;
      }
    },

    seekForward() {
      if (this.$refs.audioPlayer.currentTime <= this.$refs.audioPlayer.duration - 5) {
        this.$refs.audioPlayer.currentTime += 5;
      } else {
        this.$refs.audioPlayer.currentTime = this.$refs.audioPlayer.duration;
      }
    },

    jumpToFraction(num) {
      if (this.$refs.audioPlayer) {
        // 计算跳转的时间点
        const newTime = this.$refs.audioPlayer.duration * num / 10;
        this.$refs.audioPlayer.currentTime = newTime;
      }
    },

    // -- PROGRESS BAR METHODS --
    // updateProgressBar() {
    //   if (this.$refs.audioPlayer) {
    //     const currentTime = this.$refs.audioPlayer.currentTime;
    //     const duration = this.$refs.audioPlayer.duration;
    //     this.progress = (currentTime / duration) * 100;
    //     console.log("Progress updated:", this.progress); // 用於調試
    //   }
    //   console.log("Progress updated:", this.progress);
    // },

    setProgress(event) {
      if (!this.isTrackPlaying) {
        return; // 如果没有播放音乐，不执行任何操作
      }

      const progressBar = this.$refs.progressBar; // 確保您已經在progressBar元素上使用了ref="progressBar"
      const clickX = event.offsetX;
      const totalWidth = progressBar.offsetWidth;
      const clickRatio = clickX / totalWidth;
      const newTime = clickRatio * this.$refs.audioPlayer.duration;
      this.$refs.audioPlayer.currentTime = newTime;
    },

    handleTimeUpdate() {
      if (this.isLoopEnabled && this.$refs.audioPlayer) {
        const player = this.$refs.audioPlayer;
        if (player.currentTime >= this.loopEnd || player.currentTime < this.loopStart) {
          player.currentTime = this.loopStart;
        }
      }
      // ... 更新进度条等其他逻辑 ...
    },

    applyLoopSettings() {
      // this.validateAndAdjustLoopTimes();
      // this.shouldUpdateProgressBar = true;
      // this.updateProgressBar();
      // this.showLoopSection = this.isLoopEnabled;

      this.loopStart = Math.max(0, Math.min(this.inputLoopStart, this.duration));
      this.loopEnd = Math.max(this.loopStart, Math.min(this.inputLoopEnd, this.duration));

      this.inputLoopStart = this.loopStart;
      this.inputLoopEnd = this.loopEnd;

      if (this.isLoopEnabled && this.$refs.audioPlayer) {
        this.$refs.audioPlayer.currentTime = this.loopStart;
      }
      
      this.shouldUpdateProgressBar = true;
      this.updateProgressBar();
      this.showLoopSection = this.isLoopEnabled;
    },

    resetLoopSpeed() {
      this.isLoopEnabled = false;
      this.showLoopSection = false;
      this.inputLoopStart = 0;
      this.inputLoopEnd = 0;
      this.loopStart = 0;
      this.loopEnd = 0;
      this.shouldUpdateProgressBar = false;
      this.playbackSpeed= 1;
    },

    increasePlaybackSpeed() {
      const newSpeed = Math.min(2, parseFloat(this.playbackSpeed) + 0.25);
      this.playbackSpeed = newSpeed.toString();
    },

    decreasePlaybackSpeed() {
        const newSpeed = Math.max(0.25, parseFloat(this.playbackSpeed) - 0.25);
        this.playbackSpeed = newSpeed.toString();
    },

    // -- VOLUME CONTROL METHODS --
    toggleMute() {
      if (!this.isMuted) {
        // 如果当前不是静音，保存当前音量并设置为静音
        this.previousVolume = this.volume;
        this.volume = 0;
      } else {
        // 如果当前是静音，恢复之前的音量
        this.volume = this.previousVolume;
      }
      this.isMuted = !this.isMuted;
      this.$refs.audioPlayer.volume = this.volume;
      this.$refs.audioPlayer.muted = this.isMuted;
    },
  
    setVolume(newVolume) {
      this.volume = parseFloat(newVolume); // 确保转换为数字
      this.isMuted = this.volume === 0;
      this.$refs.audioPlayer.volume = this.volume;
      this.$refs.audioPlayer.muted = this.isMuted;
    },

    handleVolumeChange() {
      this.volume = this.$refs.audioPlayer.volume;
      this.isMuted = this.$refs.audioPlayer.muted || this.volume === 0;
    },

    changeVolume(amount) {
      if (!this.isTrackPlaying) {
        return; // 如果音乐没有播放，不执行任何操作
      }

      if (this.$refs.audioPlayer) {
        let newVolume = this.$refs.audioPlayer.volume + amount;
        newVolume = Math.max(0, Math.min(newVolume, 1)); // 限制在 0 到 1 之间
        this.$refs.audioPlayer.volume = newVolume;
        this.volume = newVolume; // 更新 Vue 实例中的音量状态

        const volumeButton = this.$refs.volume;
        if (volumeButton) {
          volumeButton.classList.add('volume-feedback');

          // 在 0.3 秒后移除类
          setTimeout(() => {
            volumeButton.classList.remove('volume-feedback');
          }, 100); // 与 CSS 中的 transition 时间相同
        }
      }
    },

    showSlider() {
      if (this.isTrackPlaying) {
        this.showVolumeSlider = true;
      }
    },

    hideSlider() {
      this.showVolumeSlider = false;
    },

    applyVolume() {
      this.$refs.audioPlayer.volume = this.isMuted ? 0 : this.volume;
    },

    updateVolume() {
      this.$refs.audioPlayer.volume = this.volume;
    },

    // -- UTILITY METHODS --
    formatTime(timeInSeconds) {
      if (!timeInSeconds) return '0:00';
      const mins = Math.floor(timeInSeconds / 60);
      const secs = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
      return `${mins}:${secs}`;
    },

    updateProgress(e) {
      const progressBarRect = this.$refs.progressBar.getBoundingClientRect();
      let newProgress = (e.pageX - progressBarRect.left) / progressBarRect.width * 100;
      newProgress = Math.max(0, Math.min(newProgress, 100));
      this.progress = newProgress;
    },

    updateProgressBar() {
      if (this.$refs.audioPlayer) {
        const currentTime = this.$refs.audioPlayer.currentTime;
        const duration = this.$refs.audioPlayer.duration;
        this.progress = (currentTime / duration) * 100;
        this.currentTime = currentTime; // 更新 currentTime
        
        // 如果循环播放被激活，则更新循环部分的百分比
        if (this.isLoopEnabled) {
          this.loopStartPercent = (this.loopStart / duration) * 100;
          this.loopEndPercent = (this.loopEnd / duration) * 100;
        }
        this.shouldUpdateProgressBar = false;
      }
    },

    // -- KEY DOWN --

    handleKeydown(event) {
      // 检查是否聚焦在输入框，并且按键不是'L'或'l'
      if ((document.activeElement === this.$refs.loopStartInput || document.activeElement === this.$refs.loopEndInput) && event.key.toLowerCase() !== 'l') {
        return; // 如果是，则不执行任何操作，除非按下的是'L'键
      }

      if (event.key === 'ArrowRight') {
        this.seekForward();
      }
      else if (event.key === 'ArrowLeft') {
        this.seekBackward();
      }
      else if (event.key === ' ' || event.key === 'Spacebar') {
        this.togglePlayPause();
      }
      else if (!isNaN(parseInt(event.key, 10))) {
        // 确保按键是 0-9 的数字
        const num = parseInt(event.key, 10);
        if (num >= 0 && num <= 9) {
          this.jumpToFraction(num);
        }
      }
      else if (event.key === 'ArrowUp') {
        this.changeVolume(0.05); // 增加音量
      }
      else if (event.key === 'ArrowDown') {
        this.changeVolume(-0.05); // 减少音量
      }
      else if (event.key.toLowerCase() === 'r') {
        this.toggleRepeat();
      }
      else if (event.key === '>') {
        this.increasePlaybackSpeed();
      } 
      else if (event.key === '<') {
        this.decreasePlaybackSpeed();
      }
      else if (event.key.toLowerCase() === 'l') {
        this.isLoopEnabled = !this.isLoopEnabled;
      }
      else if (event.key === 'N' && event.shiftKey) {
        this.playNext();
      }
      else if (event.key === 'P' && event.shiftKey) {
        this.playPrevious();
      }
      else if (event.key.toLowerCase() === 'm') {
        this.toggleMute();
      }
      else if (event.key.toLowerCase() === 'k') {
        this.inputLoopStart = this.currentTime;
      }
      else if (event.key === ';') {
        this.inputLoopEnd = this.currentTime;
      }
      else if (event.key === "'") {
        this.applyLoopSettings();
      }
    },

    initializeSlider() {
      this.$nextTick(() => {
        const progressBar = this.$refs.progressBar;
        let moving = false;
  
        progressBar.addEventListener('mousedown', (e) => {
          moving = true;
          this.updateProgress(e);
          if (this.$refs.audioPlayer) {
            this.$refs.audioPlayer.pause();
          }
        });
  
        document.addEventListener('mousemove', (e) => {
          if (moving) {
            this.updateProgress(e);
          }
        });
  
        document.addEventListener('mouseup', (e) => {
          if (moving) {
            moving = false;
            const newTime = this.progress / 100 * this.$refs.audioPlayer.duration;
            this.$refs.audioPlayer.currentTime = newTime;
            if (this.$refs.audioPlayer) {
              this.$refs.audioPlayer.play();
            }
          }
        });
      });
    },

    // -- PLAYLIST DRAGGING --
    dragStartItem(index, event) {
      this.draggingItemIndex = index;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', index);
    },
  
    dragEnterItem(index, event) {
      if (index !== this.draggingItemIndex && event) {
        event.preventDefault();
        // 执行实际的排序逻辑
        const itemToMove = this.playlist[this.draggingItemIndex];
        this.playlist.splice(this.draggingItemIndex, 1);
        this.playlist.splice(index, 0, itemToMove);
    
        // 更新当前播放曲目的索引
        if (this.currentTrackIndex === this.draggingItemIndex) {
          this.currentTrackIndex = index;
        } else if (this.draggingItemIndex < this.currentTrackIndex && index >= this.currentTrackIndex) {
          this.currentTrackIndex--;
        } else if (this.draggingItemIndex > this.currentTrackIndex && index <= this.currentTrackIndex) {
          this.currentTrackIndex++;
        }
    
        this.draggingItemIndex = index; // 更新拖动索引为新位置
      }
    },
  
    dragEndItem() {
      this.draggingItemIndex = -1;
    },

    checkDeviceType() {
      this.isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
 
    togglePlaylist() {
      this.isPlaylistVisible = !this.isPlaylistVisible; // 切换播放列表的显示状态
    }
    
  },
  computed: {
    isPlaying() {
      return this.$refs.audioPlayer && !this.$refs.audioPlayer.paused;
  },
    formattedCurrentTime() {
      return this.formatTime(this.currentTime);
    },
    formattedDuration() {
      return this.formatTime(this.duration);
    },
    loopStartPercent() {
      return this.loopStart / this.$refs.audioPlayer.duration * 100;
    },
    loopEndPercent() {
      return this.loopEnd / this.$refs.audioPlayer.duration * 100;
    }
  },
  watch: {
    // 更新進度條和歌曲總長度
    '$refs.audioPlayer.duration': function () {
      this.audioReady = true;
      this.updateProgressBar();
    },
    playbackSpeed(newSpeed) {
      if (this.$refs.audioPlayer) {
          this.$refs.audioPlayer.playbackRate = parseFloat(newSpeed);
      }
    }
  },

  mounted() {
    this.$nextTick(() => {
      if (this.$refs.audioPlayer) {
        // this.$refs.audioPlayer.addEventListener('timeupdate', this.updateProgressBar);
        this.$refs.audioPlayer.addEventListener('timeupdate', () => {
          this.updateProgressBar();
        });
        this.$refs.audioPlayer.addEventListener('play', () => {
          this.isPlaying = true;  // 當音樂播放時設置 isPlaying 為 true
        });
        this.$refs.audioPlayer.addEventListener('pause', () => {
          this.isPlaying = false;  // 當音樂暫停時設置 isPlaying 為 false
        });
        
        this.$refs.audioPlayer.addEventListener('durationchange', () => {
          this.duration = this.$refs.audioPlayer.duration;
        });
        this.$refs.audioPlayer.addEventListener('ended', this.playNext);

        // 设置 audioPlayer 的初始音量
        this.$refs.audioPlayer.volume = this.volume;

        // 可选：如果在其他地方更改了音量，同步更新滑块的值
        this.$refs.audioPlayer.addEventListener('volumechange', () => {
          this.volume = this.$refs.audioPlayer.volume;
        });
        this.$refs.audioPlayer.addEventListener('volumechange', this.handleVolumeChange);

        this.$refs.audioPlayer.playbackRate = parseFloat(this.playbackSpeed);
      }
      this.initializeSlider();
      window.addEventListener('keydown', this.handleKeydown);
    });
    this.checkDeviceType();
  },

  beforeDestroy() {
    // 在组件销毁之前移除事件监听器
    window.removeEventListener('keydown', this.handleKeydown);
  }
  
});

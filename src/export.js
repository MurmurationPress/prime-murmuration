export class ExportManager {
  constructor(canvas,status,config){ this.canvas=canvas;this.status=status;this.config=config;this.recorder=null;this.frameExport=null;this.capturing=false; }
  png(){ const a=document.createElement('a');a.download=`prime-murmuration-${String(Date.now())}.png`;a.href=this.canvas.toDataURL('image/png');a.click(); }
  async startFrames(){
    if(this.frameExport){this.frameExport=null;this.status('PNG sequence stopped');return;}
    let directory=null;
    if('showDirectoryPicker' in window){ try{directory=await window.showDirectoryPicker({mode:'readwrite'});}catch{return;} }
    this.frameExport={directory,index:0,total:Math.round(this.config.duration*this.config.fps)};
    this.status(directory?'Writing PNG sequence…':'Downloading PNG frames…');
  }
  async captureFrame(){
    const job=this.frameExport;if(!job||this.capturing)return;
    this.capturing=true;
    try {
      const blob=await new Promise(resolve=>this.canvas.toBlob(resolve,'image/png'));
      const name=`prime-${String(job.index).padStart(4,'0')}.png`;
      if(job.directory){const handle=await job.directory.getFileHandle(name,{create:true});const writer=await handle.createWritable();await writer.write(blob);await writer.close();}
      else {const a=document.createElement('a');a.download=name;a.href=URL.createObjectURL(blob);a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
      job.index++;this.status(`PNG sequence ${job.index}/${job.total}`);
      if(job.index>=job.total){this.frameExport=null;this.status('PNG sequence complete');}
    } finally { this.capturing=false; }
  }
  toggleWebM(){
    if(this.recorder){this.recorder.stop();return;}
    if(!window.MediaRecorder){this.status('MediaRecorder unavailable');return;}
    const chunks=[],stream=this.canvas.captureStream(this.config.fps);
    const options=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?{mimeType:'video/webm;codecs=vp9'}:{};
    this.recorder=new MediaRecorder(stream,options);
    this.recorder.ondataavailable=e=>chunks.push(e.data);
    this.recorder.onstop=()=>{const blob=new Blob(chunks,{type:'video/webm'}),a=document.createElement('a');a.download='prime-murmuration.webm';a.href=URL.createObjectURL(blob);a.click();this.recorder=null;this.status('WebM saved');};
    this.recorder.start();this.status('Recording WebM…');setTimeout(()=>{if(this.recorder?.state==='recording')this.recorder.stop();},this.config.duration*1000);
  }
}

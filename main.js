const http = require("http");
const path = require("path");
const { Nuxt, Builder } = require("nuxt");
let config = require("./nuxt.config.js");

config.rootDir = __dirname;

const nuxt = new Nuxt(config);
const builder = new Builder(nuxt);
const server = http.createServer(nuxt.render);


let _NUXT_URL_ = "";
if (config.dev) {
  builder.build().catch(err => {
      
    console.error(err);
    process.exit(1);
  });
  server.listen();
  _NUXT_URL_ = `http://localhost:${server.address().port}`;
  console.log(`Nuxt working on ${_NUXT_URL_}`);
} else {
  _NUXT_URL_ = "file://" + __dirname + "/dist/index.html";
}

let win = null;
const electron = require("electron");
const app = electron.app;

const newWin = () => {
    win = new electron.BrowserWindow({
        width:600,
        height:600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.resolve(path.join(__dirname, "preload.js"))
        }
    });
    win.on("closed", () => (win = null));
    if (config.dev) {
        // const {
        // default: installExtension,
        // VUEJS_DEVTOOLS
        // } = require("electron-devtools-installer");
        // installExtension(VUEJS_DEVTOOLS.id)
        // .then(name => {
        //     console.log(`Added Extension:  ${name}`);
        //     win.webContents.openDevTools();
        // })
        // .catch(err => console.log("An error occurred: ", err));
    const pollServer = () => {
      http
        .get(_NUXT_URL_, res => {
          if (res.statusCode === 200) {
            win.loadURL(_NUXT_URL_);
          } else {
            console.log("restart poolServer");
            setTimeout(pollServer, 300);
          }
        })
        .on("error", pollServer);
    };
    pollServer();
  } else {
    return win.loadURL(_NUXT_URL_);
  }
};
app.on("ready", newWin);
app.on("window-all-closed", () => app.quit());
app.on("activate", () => win === null && newWin());



const {ipcMain}=require("electron")
const t=require("./utils/main/main")

console.log("ipcMainにセット")
for(const key of Object.keys(t)){
  const func=t[key]
  const funcName=key
  ipcMain.handle(funcName,func)
  console.log("set: ",funcName)
}

ipcMain.handle("maximizeWindow",(event,args)=>{
  win.maximize()
})


const Menu=electron.Menu
const isMac=process.platform==="darwin"

const template=[
  ...(isMac?[{
    label:app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }]:[]),
  {
    label:"ファイル",
    submenu:[
      isMac?
        {role:"close",label:"閉じる"}:
        {role:"quit",label:"閉じる"}
    ]
  },
  {
    label:"編集",
    submenu:[
      {role:"undo",label:"元に戻す(undo)"},
      {role:"redo",label:"やり直し(redo)"}
    ]
  },
  {
    label:"ビュー",
    submenu:[
      {role:"reload",label:"リロード"},
      {role:"forceReload",label:"強制リロード"},
      {role:"toggleDevTools",label:"開発ツール切り替え"},
      { type: 'separator' },
      {role:"togglefullscreen",label:"フルスクリーン"}
    ]
  },
  {
    label:"ウィンドウ",
    submenu:[
      {role:"minimize",label:"最小化"},
      {label:"最大化",click:()=>win.maximize()}
    ]
  }
]

const menu=Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)
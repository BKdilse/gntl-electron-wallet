# GNTL Electron (GUI) Wallet
<img src="https://github.com/The-GNTL-Project/Images/raw/master/GNTL_Icon_Round_200x200.png" alt="GNTL Coin">

Copyright (c) 2021-2024 The GNTL Project    
Copyright (c) 2018-2021, The Arqma Network   

## Introduction
GNTL is a private cryptocurrency based on ArQmA.
More information on the project can be found on the [website](https://gntl.cash).  GNTL is an open source project, and we encourage contributions from anyone with something to offer.

## About this project
This is the new Electron GUI for GNTL.  It is open source and completely free to use without restrictions, anyone may create an alternative implementation of the GNTL Electron GUI that uses the protocol and network in a compatible manner.

Please submit any changes as pull requests to the development branch, all changes are assessed in the development branch before being merged to master, release tags are considered stable builds for the GUI.

## Compile from Source (Windows)
### Pre-requisites
#### GNTL Release binaries
Grab the download link for the latest [GNTL Release](https://gntl.cash/pages/downloads.html).

We'll use **v1.0.6** as an example:
* Download https://gntl.cash/downloads/GNTL-Windows-x86_64-v1.0.6.7z
* Extract **gntld.exe** and **gntl-wallet-rpc.exe** to **C:\GNTL**, and then delete the downloaded file

#### Install Node Version Manager
This is the version that has been tested, later versions may work.  Install it using the default options.
* https://github.com/coreybutler/nvm-windows/releases/download/1.1.12/nvm-setup.exe

#### Install Git
This is the version that has been tested, later versions may work.  Install it using the default options.
* https://github.com/git-for-windows/git/releases/download/v2.45.1.windows.1/Git-2.45.1-64-bit.exe

### Compile
* Launch PowerShell as Administrator, and run the following:
```
nvm install 12.20.2
nvm use 12.20.2
npm install -g windows-build-tools
* This will take some times, due to the size of Visual Studio Build Tools.
* Installation may never show complete, but once you see Visual Studio Build Tools 2017 appear in Programs and Features:
* do a CTRL-C in PowerShell to terminate the install script. 

$env:PYTHON = "$env:USERPROFILE\.windows-build-tools\python27\python.exe"
npm config set python "$env:USERPROFILE\.windows-build-tools\python27\python.exe"
npm config set msvs_version 2017

npm install -g quasar-cli
cd\
git clone https://github.com/The-GNTL-Project/gntl-electron-wallet
cd gntl-electron-wallet
copy \GNTL\*.* bin

npm install -f
```

#### Development
**Note:** This will only run the wallet, for development purposes.
```
npm run dev
```

### Build
```
npm run build
```

## Compile from Source (Linux)
### Pre-requisites
#### GNTL Release binaries
Grab the download link for the latest [GNTL Release](https://gntl.cash/pages/downloads.html).

We'll use **v1.0.5** as an example:
```
wget https://gntl.cash/downloads/GNTL-Linux-x86_64-Ubuntu-2004-v1.0.5.tar.gz
```

Create **~/gntl/**, extract binaries, and remove the downloaded file:
```
mkdir ~/gntl/
tar -xvf GNTL-Linux-x86_64-Ubuntu-2004-v1.0.5.tar.gz -C ~/gntl/
rm GNTL-Linux-x86_64-Ubuntu-2004-v1.0.5.tar.gz
```

#### Install Node Version Manager
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
```

### Compile
```
nvm install 12.20.2
nvm use 12.20.2
npm install -g quasar-cli
git clone https://github.com/The-GNTL-Project/gntl-electron-wallet
cd gntl-electron-wallet
cp ~/gntl/gntld bin/
cp ~/gntl/gntl-wallet-rpc bin/
npm install -f
```

#### Development
**Note:** This will only run the wallet, for development purposes.
```
npm run dev
```

### Build
```
npm run build
```

## Adding language support
Adding a new language is fairly simple.

1. Duplicate the language file `src/i18n/en-us.js` and rename it to the relevant language code.
2. Translate all the strings in that duplicated file. Take note that capitalization matters.
    - The translated string must go in-between the quotes (`""`)
      - E.G `all: "ALL"` -> `all: "ВСЕ"`
    - If possible try and stick to the general string formatting already present.
      - E.G if there is a new line then try and keep that in your translation.
      - The same goes for the pipe character `|`. **DO NOT REMOVE IT**.
    - Please don't translate strings inside `{}` brackets. They are meant as placeholders for other values.
      - Some examples include `{type}` and `{count}`.
      - E.G if you have a string `A {index}` then you may translate it as `B {index}` or `{index} B` depending on how the string makes sense in your language. You are allowed to reposition the placeholders for the string to make sense **BUT DO NOT DELETE OR REPLACE THE PLACEHOLDERS WITH OTHER VALUES**
3. Add the language to the `languages` array in `src/i18n/index.js`. The `flag` property is the [ISO 3166-1-alpha-2 code](https://www.iso.org/obp/ui/#search/code/) of a country.
   - **NOTE: DO NOT ADD THE LANGUAGE TO `export default`**. Dynamic language loading is handled by the application.
4. Add your language locale to Vue Timeago. Add it in `src/plugins/timeago.js` under `locales`.
   - Ref: https://github.com/egoist/vue-timeago#update-locale-globally
5. Submit a PR with your changes.

## Credits
mosu-forge https://github.com/ryo-currency/ryo-wallet

Mikunj https://github.com/loki-project/loki-electron-gui-wallet

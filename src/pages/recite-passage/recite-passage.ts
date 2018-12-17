import { Component, ViewChild } from '@angular/core';
import { Events, NavController, NavParams, ToastController } from 'ionic-angular';
import { Storage } from "@ionic/storage";
import { SpeechRecognition } from '@ionic-native/speech-recognition';
import moment from 'moment';

/**
 * Generated class for the RecitePassagePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */
@Component({
  selector: 'page-recite-passage',
  templateUrl: 'recite-passage.html'
})
export class RecitePassagePage {
  @ViewChild('content') content:any;

  reference;
  passage;
  parts: Array<String>;
  shown: Array<String>;
  counter: number;
  currentPhrase: String;
  endOfPassage: boolean = false;
  previousPassageExists;
  nextPassageExists;
  folder;
  passagesInFolder;
  indexInFolder;
  folderObject;
  speechReady = false;
  contentClass = "recite-passage";

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              private storage: Storage,
              public events: Events,
              private toastCtrl: ToastController,
              private speechRecognition: SpeechRecognition) {
    this.storage.get("useSansForgetica").then((value) => {
      if (value) this.contentClass = "recite-passage forgetica-enabled"
    });

    this.shown = [];
    this.counter = 0;

    this.folder = this.navParams.data.folder;
    this.passagesInFolder = this.navParams.data.passagesInFolder;
    this.indexInFolder = this.navParams.data.index;
    this.fetchPassage();
  }

  fetchPassage() {
    if (this.passagesInFolder == null || this.indexInFolder == null || this.indexInFolder < 0 || this.indexInFolder >= this.passagesInFolder.length) {
      let toast = this.toastCtrl.create({
        message: 'Could not find passage',
        duration: 2000,
        position: 'bottom'
      });
      toast.present();
      this.navCtrl.pop();
      return;
    }

    this.reference = this.passagesInFolder[this.indexInFolder].reference;
    this.previousPassageExists = this.indexInFolder > 0;
    this.nextPassageExists = this.indexInFolder < this.passagesInFolder.length - 1;

    this.storage.get(this.reference).then((passage) => {
      if (passage == null) {
        let toast = this.toastCtrl.create({
          message: 'Could not find ' + this.reference + ' ... please delete and re-add',
          duration: 2000,
          position: 'bottom'
        });
        toast.present();
        this.navCtrl.pop();
        return;
      }

      this.passage = passage;
      this.storage.get("replaceTheLORDwithYHWH").then((value) => {
        if (value) {
          this.passage = this.passage.replace(/(([Tt]he |)LORD)|GOD/g, "YHWH");
        }

        if (this.reference.toLowerCase().startsWith("psalm")) {
          this.parts = this.passage
            .split(/#/)
            .filter((part) => part !== undefined && part.trim() !== '')
            .map((part) => this.checkForIndentAtStartOfVerse(part));
        } else {
          this.parts = [];
          var verses = this.passage
            .split(/\[/)
            .filter((part) => part !== undefined && part.trim() !== '')
            .map((part) => '[' + part);
          verses.forEach(this.splitVerse.bind(this));
        }
      });
    });
  }

  checkForIndentAtStartOfVerse(line) {
    if (line.search("\\[[0-9]+\\]&nbsp;&nbsp;&nbsp;&nbsp;.*") != -1) {
      return "&nbsp;&nbsp;&nbsp;&nbsp;" + line.replace("&nbsp;&nbsp;&nbsp;&nbsp;", "");
    }
    return line;
  }

  splitVerse(verse) {
    var poeticLines = verse
      .split(/#/)
      .filter((part) => part !== undefined && part.trim() !== '');
    if (poeticLines.length > 1) {
      this.parts = this.parts.concat(poeticLines);
      return;
    }

    verse = verse.replace(/#/, " ");

    if (verse.length < 20) {
      this.parts.push(verse);
      return;
    }

    var words = verse.split(/ /);
    this.currentPhrase = "";

    if (verse.search(/[.?!"”'\),;:-]/) == -1) {
      if (words.length < 16) {
        this.parts.push(verse);
        return;
      }

      // Divide the verse in 2
      for (var i = 0; i < words.length; i++) {
        this.currentPhrase += words[i] + " ";
        if (i == words.length / 2) {
          this.parts.push(this.currentPhrase);
          this.currentPhrase = "";
        }
      }
      this.parts.push(this.currentPhrase);
      this.currentPhrase = "";
      return;
    }

    var index = this.forwardUntilPunctuation(words, 0);

    do {
      if (this.currentPhrase.trim().length != 0) {
        this.parts.push(this.currentPhrase);
        this.currentPhrase = "";
      }
      index = this.forwardUntilPunctuation(words, index + 1);
    } while (index < words.length - 1);

    if (this.currentPhrase.length < 15) {
      // last phrase is small, so add it onto previous one
      this.currentPhrase = this.parts.pop() + "" + this.currentPhrase;
    }

    this.parts.push(this.currentPhrase);
  }

  // Collects words into currentPhrase until a punctuation mark is reached
  // Returns the index reached
  forwardUntilPunctuation(words, index) {
    for (var i = index; i < words.length; i++) {
      var word = words[i];
      if (i == words.length - 1) {
        this.currentPhrase += word;
        return i;
      }
      this.currentPhrase += word + " ";

      if (word.length < 2) continue;
      var c = word.charAt(word.length - 1);
      switch (c) {
        case '.':
        case '?':
        case '!':
        case '"':
        case '”':
        case '\'':
          return i;
        case ')':
        case ',':
        case ';':
        case ':':
        case '-':
          if (i - index > 2) return i;
      }
    }

    return words.length - 1;
  }

  ionViewDidLoad() {
  }

  onClickFAB = () => {
    this.onShowPart();
  }

  displayVerseMarker(part) {
    var verseNumbers = part.match(/\[[0-9]+\]/g);
    if (!verseNumbers || verseNumbers.length < 1) return;
    var verseNumber = verseNumbers[0].replace(/[\[\]]/g, '');

    // todo display verse number separately
    console.log('part: ' + part);
    console.log('verse: ' + verseNumber);
  }

  onShowPart = () => {
    if (this.counter >= this.parts.length) {
      return;
    }

    this.displayVerseMarker(this.parts[this.counter]);
    this.counter++;
    this.shown = this.parts.slice(0, this.counter);
    if (this.counter >= this.parts.length) {
      this.finishPassage();
    }

    this.scrollDown();
  }

  onShowVerse = () => {
    if (this.counter >= this.parts.length) {
      return;
    }

    do {
      this.displayVerseMarker(this.parts[this.counter]);
      this.counter++;
      this.shown = this.parts.slice(0, this.counter);
      if (this.counter >= this.parts.length) {
        this.finishPassage();
        break;
      }
    } while(this.parts[this.counter].search(/\[/) == -1);

    this.scrollDown();
  }

  onShowAll = () => {
    this.counter = this.parts.length;
    this.shown = this.parts;
    this.finishPassage();
    this.scrollDown();
  }

  scrollDown() {
    // The storage.get is a hack - we just need some delay before scrolling to bottom.
    // If you call this.content.scrollToBottom straight away, the page hasn't rendered yet, so it doesn't scroll all the way down
    this.storage.get(this.reference).then(() => {
      this.content.scrollToBottom(400);
    });
  }

  finishPassage() {
    this.endOfPassage = true;
    var date = moment().format("MM[/]DD[/]YY");
    let toast = this.toastCtrl.create({
      message: this.reference + ' marked as read on ' + date + '. May it dwell in you richly!',
      duration: 2000,
      position: 'middle',
      showCloseButton: true,
      closeButtonText: 'Undo'
    });
    toast.onDidDismiss((data, role) => {
      if (role !== "close") {
        this.events.publish('passageRead', { folder : this.folder, passagesInFolder : this.passagesInFolder, indexInFolder : this.indexInFolder });
      }
    });
    toast.present();
  }

  onGoBack = () => {
    if (this.counter <= 0) {
      return;
    }

    this.counter--;
    this.shown = this.parts.slice(0, this.counter);
    this.endOfPassage = false;
  }

  onHideAll = () => {
    this.shown = [];
    this.counter = 0;
    this.endOfPassage = false;
  }

  onPrevious = () => {
    this.onHideAll();
    this.indexInFolder--;
    this.fetchPassage();
  }

  onNext = () => {
    this.onHideAll();
    this.indexInFolder++;
    this.fetchPassage();
  }

  onRecite = () => {
    if (this.speechReady){
      this.startRecognition();
      return;
    }

    this.speechRecognition.isRecognitionAvailable().then((recognitionAvailable: boolean) => {
      if (!recognitionAvailable) {
        let toast = this.toastCtrl.create({
          message: 'Speech recognition is not available on this device; sorry.',
          duration: 2000,
          position: 'bottom'
        });
        toast.present();
        return;
      }

      this.speechRecognition.hasPermission().then((hasPermission: boolean) => {
        if (!hasPermission) {
          this.speechRecognition.requestPermission().then(() => {
            this.startRecognition();
          });
        }
        else {
          this.speechReady = true;
          this.startRecognition();
        }
      });
    });
  }

  startRecognition() {
    this.speechRecognition.startListening({ matches: 8, prompt: "Speak the phrase; I'll correct you if you go wrong." })
      .subscribe(
      (matches: Array<string>) => {
        if (this.counter >= this.parts.length) {
          let toast = this.toastCtrl.create({
            message: "You've reached the end of the passage.",
            duration: 2000,
            position: 'bottom'
          });
          toast.present();
          return;
        }

        this.onShowPart();
        var nextPhrase = this.shown[this.shown.length - 1]
          .toLowerCase()
          .replace(/\[[0-9]+\] /g,'')
          .replace(/  /g,' ')
          .replace(/&nbsp;/g,'')
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
          .trim();
        var matched = false;
        matches.forEach((match) => {
          if (matched) return;
          if (match.toLowerCase() === nextPhrase) {
            let toast = this.toastCtrl.create({
              message: "Correct!",
              duration: 2000,
              position: 'bottom'
            });
            toast.present();
            matched = true;
          }
        });
        if (!matched) {
          let toast = this.toastCtrl.create({
            message: "The phrase we were looking for was '" + nextPhrase + "'",
            duration: 8000,
            position: 'bottom'
          });
          toast.present();
          //this.shown = matches;
          // todo - remove above line; this is debug
        }
      },
      (onerror) => {
        let toast = this.toastCtrl.create({
          message: 'error: ' + onerror,
          duration: 8000,
          position: 'bottom'
        });
        toast.present();
      }
    );
  }
}
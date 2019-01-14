import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, AlertController } from 'ionic-angular';

/**
 * Generated class for the SearchPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-search',
  templateUrl: 'search.html',
})
export class SearchPage {

  searchText;
  passages;

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              private toastCtrl: ToastController,
              public alertCtrl: AlertController) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SearchPage');
  }

  info() {
    let alert = this.alertCtrl.create();
    alert.setTitle('Search Help');
    alert.setMessage('Enter one or more words to search for (punctuation and upper/lower case will be ignored). If you want results for an exact phrase, wrap your phrase in "double quotes" (note that punctuation will not match in an exact phrase).');
    alert.addButton('Ok');
    alert.present();
  }

  search() {
    if (!this.searchText) {
      let toast = this.toastCtrl.create({
        message: 'Please enter search text',
        duration: 2000,
        position: 'bottom'
      });
      toast.present();
      return;
    }

    // The ESV API doesn't handle punctuation
    this.searchText = this.searchText.replace(/[.,\/#!£$%\^&\*;:@{}=\-_`~()]/g,"");

    var URL = 'https://api.esv.org/v3/passage/search/?q=' + this.searchText + '&page-size=100';
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = (function() {
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
        var jsonResponse = JSON.parse(xmlHttp.responseText);
        this.passages = jsonResponse["results"];
        var toastText = "";
        if (jsonResponse["total_results"] == 1) {
          toastText = 'Got 1 result';
        }
        else {
          toastText = 'Got ' + jsonResponse["total_results"] + ' results';
          if (jsonResponse["total_results"] > 100) {
            toastText += '; only the first 100 are shown'
          }
        }
        let toast = this.toastCtrl.create({
          message: toastText,
          duration: 2000,
          position: 'bottom'
        });
        toast.present();
      }
    }).bind(this);
    xmlHttp.open( "GET", URL, true );
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.setRequestHeader('Authorization', "Token 332b2b26bf6328da3e8d2b4aaf99155600668fcc");
    xmlHttp.send( null );
  }

  selectPassage(passage) {
    let alert = this.alertCtrl.create();
    alert.setTitle(passage.reference);
    alert.setMessage(passage.content);
    alert.addButton({
      text: 'Open',
      handler: () => {
        this.navCtrl.push('AddPassagePage', { reference: passage.reference });
      }
    });
    alert.addButton('Cancel');
    alert.present();
  }
}

import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { IonicStorageModule } from '@ionic/storage';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { SocialSharing } from "@ionic-native/social-sharing";
import { SpeechRecognition } from '@ionic-native/speech-recognition';

import { MyApp } from './app.component';
import { BiblePage } from '../pages/bible/bible';
import { MenuPage } from '../pages/menu/menu';
import { RecitePassagePage } from "../pages/recite-passage/recite-passage";
import { SettingsPage } from "../pages/settings/settings";
import { SuggestionsPage } from "../pages/suggestions/suggestions";

@NgModule({
  declarations: [
    MyApp,
    BiblePage,
    MenuPage,
    RecitePassagePage,
    SettingsPage,
    SuggestionsPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    BiblePage,
    MenuPage,
    RecitePassagePage,
    SettingsPage,
    SuggestionsPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    SocialSharing,
    SpeechRecognition,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
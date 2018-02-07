import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { AngularFirestore } from 'angularfire2/firestore';

@Component({
  selector: 'page-about',
  templateUrl: 'about.html'
})
export class AboutPage {

  event = []
  workshop = []
  participants = [{
    displayName: null,
    email: null,
    mobno: null,
    college: null
  }]
  selectedEvent: string;
  constructor(public navCtrl: NavController, private db: AngularFirestore) {
      this.db.collection('events').ref.get().then(query => {
        this.event = []
        query.forEach(doc => {
          this.event.push(doc.data().id)
        })
      }).catch(err => console.log(err))
      this.db.collection('workshops').ref.get().then(query => {
        this.workshop = []
        query.forEach(doc => {
          this.workshop.push(doc.data().id)
        })
      }).catch(err => console.log(err))
  }
}

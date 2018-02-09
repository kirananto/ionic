import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { AngularFirestore } from 'angularfire2/firestore';
import { AngularFireAuth } from 'angularfire2/auth';
import { AlertController } from 'ionic-angular';

@Component({
  selector: 'page-about',
  templateUrl: 'about.html'
})
export class AboutPage {

  event = []
  workshop = []
  events = []
  participants = [{
    displayName: null,
    email: null,
    mobno: null,
    college: null
  }]
  loading = true;
  selectedEvent: string;
  user: any;
  constructor(public navCtrl: NavController, private db: AngularFirestore, public alertCtrl: AlertController,private firebaseAuth: AngularFireAuth) {
      this.user = this.firebaseAuth.auth.currentUser
      this.db.collection('events').ref.where('open', '==', true).get().then(query => {
        this.event = []
        this.loading = false
        query.forEach(doc => {
          this.events.push(doc.data())
          this.event.push(doc.data().id)
        })
      }).catch(err => console.log(err))
      this.db.collection('workshops').ref.where('open', '==', true).get().then(query => {
        this.workshop = []
        query.forEach(doc => {
          this.events.push(doc.data())
          this.workshop.push(doc.data().id)
        })
      }).catch(err => console.log(err))
  }
  addParticipants() {
    if ( this.selectedEvent !== null) {
        var e = this.events.filter(event => event.id === this.selectedEvent)
        if (e.length == 0) {
          this.alertCtrl.create({
            title: 'Sorry',
            subTitle: 'Please select the Event Name',
            buttons: ['ok']
          }).present()
        } else {
          if (this.participants.length < e[0].max_participants) {
            this.participants.push({
              displayName: null,
              email: null,
              mobno: null,
              college: null
            })
            console.log('d')
          } else if (this.participants.length === e[0].max_participants) {
          } else {
            this.participants.pop()
            console.log('s')
          }
        }
    }
  }
  public submit () {
    if (this.firebaseAuth.auth.currentUser === null) {
      this.alertCtrl.create({
        title: 'Sorry',
        subTitle: 'Please Login First',
        buttons: ['ok']
      }).present()
    } else if (this.selectedEvent === undefined) {
      this.alertCtrl.create({
        title: 'Sorry',
        subTitle: 'Please Select an Event First',
        buttons: ['ok']
      }).present()
    } else if(this.participants[0].displayName == null) { 
      this.alertCtrl.create({
        title: 'Sorry',
        subTitle: 'Please enter details',
        buttons: ['ok']
      }).present()
    } else {
      console.log('e')
      this.alertCtrl.create({
        title: 'Enter Amount Collected',
        message: 'Please enter exact amount collected',
        inputs: [
          {
            name: 'title',
            placeholder: 'Enter the amount Collected'
          }
        ],
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => {
              console.log('Cancel clicked');
            }
          },
          {
            text: 'Submit',
            handler: (data) => {
              var amount = parseInt(data.title)
              this.alertCtrl.create({
                title: 'Confirm Submission',
                message: 'Only Press agree if they have paid?',
                buttons: [
                  {
                    text: 'Cancel',
                    role: 'cancel',
                    handler: () => {
                      console.log('Cancel clicked');
                    }
                  },
                  {
                    text: 'Submit',
                    handler: () => {
                      this.db.collection('paid').ref.doc().set({
                        eventId: this.selectedEvent,
                        participants: this.participants,
                        cashier: this.firebaseAuth.auth.currentUser.email
                      }).then(success => {
                        this.db.collection('cashiers').doc('todays').collection(this.firebaseAuth.auth.currentUser.uid).ref.add({
                          eventId: this.selectedEvent,
                          amount: amount
                        }).then(success => {
                          this.alertCtrl.create({
                            title: 'Success',
                            subTitle: 'Successfully Registered',
                            buttons: ['OK']
                          }).present()
                          this.participants = [{
                            displayName: null,
                            email: null,
                            mobno: null,
                            college: null
                          }]
                          this.selectedEvent = ''
                        })
                      })
                    }
                  }]
              }).present()
            }
          }
        ]
      }).present()
    }
  }
}

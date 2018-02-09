import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { Observable } from 'rxjs/Observable';
import { AlertController } from 'ionic-angular';
import { AngularFirestore } from 'angularfire2/firestore';
import { AngularFireAuth } from 'angularfire2/auth';
// import * as firebase from 'firebase/app';
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  collection: number;

  events = []
  constructor(public navCtrl: NavController, private barcodeScanner: BarcodeScanner, private db: AngularFirestore,private firebaseAuth: AngularFireAuth, public alertCtrl: AlertController) {
      this.user = this.firebaseAuth.auth.currentUser
      this.collection = 0
      this.db.collection('events').ref.where('open', '==', true).get().then(querySnapshot => {
        this.events = []
        querySnapshot.forEach(doc => {
          this.events.push(doc.data().id)
        })
        this.alertCtrl.create({
          title: 'Loaded data',
          message: 'Now scan..!!'
        }).present()
      })
   }
  encodeData: string;
  scanData: string;
  encodedData : {} ;
  tobePaid = []
  selected = 0
  data = []

  loading = false;
  username: any;
  password: any;
  user = null;
  amount = 0;
  public items: Observable<any[]>;

  public togglePaid(item, i) {
    if (this.tobePaid.indexOf(item) === -1) {
      this.amount += parseInt((item.participants.length*50).toString())
      this.data[i].color = '#f1f1f1'
      console.log(this.data[i].color)
      this.tobePaid.push(item)
    } else {
      this.amount -= parseInt((item.participants.length*50).toString())
      this.data[i].color = 'white'
      this.tobePaid = this.tobePaid.filter(v => v !== item)
    }
    this.selected = this.tobePaid.length
  };
  public scan() {
    this.tobePaid = []
    this.amount = 0
    this.data = []
    this.selected = null
    this.db.collection('cashiers').doc('todays').collection(this.firebaseAuth.auth.currentUser.uid).ref.get().then(query => {
      console.log(query.size)
      query.forEach(doc => {
          this.collection += parseInt(doc.data().amount)
      }) 
    })
    console.log(this.events)
    this.barcodeScanner.scan().then((barcodeData) => {
        this.scanData = barcodeData.text;
        // this.scanData = 'kCQMi6JgEgOBnnyp87epfw7NwLv1'
        this.loading = true
        
        this.db.collection('registered').ref.where('uid', '==', this.scanData).get().then(QuerySnapshot => {
          this.data = []
          this.loading = false
          console.log(QuerySnapshot.size)
          QuerySnapshot.forEach((doc) => {
            if (this.events.indexOf(doc.data().eventId) !== -1 ) {
              this.data.push(doc.data())
            }
            // alert(doc.data())
          })
        }).catch(err => console.log(err))
     }, (err) => {
         // An error occurred
     }).catch(err => console.log(err));
  }

  public login() {
    this.firebaseAuth
      .auth.signInWithEmailAndPassword(this.username, this.password)
      .then(user => {
          this.user = user
      }).catch(err => {
        this.alertCtrl.create({
          title: 'Sorry Wrong Pass',
          subTitle: 'Try again',
          buttons: ['OK']
        }).present();
      })
  }

  public submit() {
    var amount = 0
    this.tobePaid.forEach(doc => {
      amount = amount + doc.participants.length
    })
    amount = amount * 50
    this.alertCtrl.create({
      title: 'Confirm Submission',
      message: `Please collect ${amount} Rupees`,
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
            var batch = this.db.firestore.batch()
            this.tobePaid.forEach(event => {
              event.cashier = this.user.email
              console.log(event)
              batch.set(this.db.collection('paid').ref.doc(), event)
            })
            batch.commit().then(success => {
              console.log('success')
              this.db.collection('cashiers').doc('todays').collection(this.firebaseAuth.auth.currentUser.uid).add({
                amount: amount
              }).then(success => {
                this.alertCtrl.create({
                  title: 'Success',
                  subTitle: 'Successfully Registered',
                  buttons: ['OK']
                }).present()
                this.tobePaid = []
                this.amount = 0
                this.data = []
                this.selected = null
              })
              
            }).catch(err => {
              this.alertCtrl.create({
                title: 'Sorry Unable to Push',
                subTitle: 'Please report this to main desk',
                buttons: ['OK']
              }).present();
            })
          }
        }
      ]
    }).present();
  }
} 

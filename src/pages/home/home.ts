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
  
  constructor(public navCtrl: NavController, private barcodeScanner: BarcodeScanner, private db: AngularFirestore,private firebaseAuth: AngularFireAuth, public alertCtrl: AlertController) { }
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
  public items: Observable<any[]>;

  public togglePaid(item, i) {
    if (this.tobePaid.indexOf(item) === -1) {
      this.data[i].color = 'grey'
      console.log(this.data[i].color)
      this.tobePaid.push(item)
    } else {
      this.data[i].color = 'white'
      this.tobePaid = this.tobePaid.filter(v => v !== item)
    }
    this.selected = this.tobePaid.length
  };
  public scan() {
    this.barcodeScanner.scan().then((barcodeData) => {
        this.scanData = barcodeData.text;
        this.loading = true
        this.db.collection('registered').ref.where('uid', '==', this.scanData).get().then(QuerySnapshot => {
          this.data = []
          this.loading = false
          console.log(QuerySnapshot.size)
          QuerySnapshot.forEach((doc) => {
            this.data.push(doc.data())
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
      .then(result => {
          console.log('logged in')
          this.user = result.user
      }).catch(err => {
        this.alertCtrl.create({
          title: 'Sorry Wrong Pass',
          subTitle: 'Try again',
          buttons: ['OK']
        }).present();
      })
  }

  public submit() {
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
            var batch = this.db.firestore.batch()
            this.tobePaid.forEach(event => {
              event.cashier = this.user
              batch.set(this.db.collection('paid').ref.doc(), event)
            })
            batch.commit().then(success => {
              console.log('success')
              let alert = this.alertCtrl.create({
                title: 'Success',
                subTitle: 'Successfully Registered',
                buttons: ['OK']
              });
              alert.present();
            }).catch(err => {
              this.alertCtrl.create({
                title: 'SorryUnable to Push',
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

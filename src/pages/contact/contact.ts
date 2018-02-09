import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { Observable } from 'rxjs/Observable';
import { AlertController } from 'ionic-angular';
import { AngularFirestore } from 'angularfire2/firestore';
import { AngularFireAuth } from 'angularfire2/auth';

@Component({
  selector: 'page-contact',
  templateUrl: 'contact.html'
})
export class ContactPage {

  workshops = [
    "AutoCAD",
    "Bal-bot",
    "DL-ML",
    "Python",
    "Triumph"
  ]
  loading = false;
  username: any;
  password: any;
  user = null;
  amount = 0;
  encodeData: string;
  scanData: string;
  encodedData : {} ;
  tobePaid = []
  selected = 0
  data = []
  public items: Observable<any[]>;
  constructor(public navCtrl: NavController, private barcodeScanner: BarcodeScanner, private db: AngularFirestore,private firebaseAuth: AngularFireAuth, public alertCtrl: AlertController) {
    this.user = this.firebaseAuth.auth.currentUser
    this.db.collection('workshops').ref.where('open', '==', true).get().then(querySnapshot => {
      this.workshops = []
      querySnapshot.forEach(doc => {
        this.workshops.push(doc.data().id)
      })
      this.alertCtrl.create({
        title: 'Loaded data',
        message: 'Now scan..!!'
      }).present()
    })
  }

  public togglePaid(item, i) {
    if (this.tobePaid.indexOf(item) === -1) {
      this.data[i].color = '#f1f1f1'
      console.log(this.data[i].color)
      this.tobePaid.push(item)
    } else {
      this.data[i].color = 'white'
      this.tobePaid = this.tobePaid.filter(v => v !== item)
    }
    this.selected = this.tobePaid.length
  };
  public scan() {
    this.data = []
    this.amount = 0
    this.tobePaid = []
    this.selected = null
    this.barcodeScanner.scan().then((barcodeData) => {
        this.scanData = barcodeData.text;
        // this.scanData = 'ZZoTctfaWiXxWumaiwnIClYpk8A2'
        this.loading = true
        this.db.collection('registered').ref.where('uid', '==', this.scanData).get().then(QuerySnapshot => {
          this.data = []
          this.loading = false
          console.log(QuerySnapshot.size)
          QuerySnapshot.forEach((doc) => {
            if (this.workshops.indexOf(doc.data().eventId) !== -1 ) {
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
    this.alertCtrl.create({
      title: 'Confirm Submission',
      message: `Please collect Rupees`,
      inputs: [
        {
          name: 'title',
          placeholder: 'Enter the amount Collected'
        },
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
            if (isNaN(data.title)) {
              this.alertCtrl.create({
                title: 'SOrry',
                subTitle: 'Please Enter a valid Amount',
                buttons: ['OK']
              }).present()
            } else {

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
                  title: 'SorryUnable to Push',
                  subTitle: 'Please report this to main desk',
                  buttons: ['OK']
                }).present();
              })
            }
          }
        }
      ]
    }).present();
  }
}

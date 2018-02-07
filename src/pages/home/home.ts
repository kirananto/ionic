import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { Observable } from 'rxjs/Observable';
import { AlertController } from 'ionic-angular';
import { AngularFirestore } from 'angularfire2/firestore';
// import { AngularFireAuth } from 'angularfire2/auth';
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  
  constructor(public navCtrl: NavController, private barcodeScanner: BarcodeScanner, private db: AngularFirestore, public alertCtrl: AlertController) { }
  encodeData: string;
  scanData: string;
  encodedData : {} ;
  tobePaid = []
  selected = 0
  data = []
  public items: Observable<any[]>;

  public togglePaid(item) {
    if (this.tobePaid.indexOf(item) === -1) {
      this.tobePaid.push(item)
    } else {
      this.tobePaid = this.tobePaid.filter(v => v !== item)
    }
    this.selected = this.tobePaid.length
  };
  public scan() {
    this.barcodeScanner.scan().then((barcodeData) => {
        this.scanData = barcodeData.text;
        this.db.collection('registered').ref.where('uid', '==', this.scanData).get().then(QuerySnapshot => {
          this.data = []
          QuerySnapshot.forEach((doc) => {
            this.data.push(doc.data())
            // alert(doc.data())
          })
        }).catch(err => console.log(err))
     }, (err) => {
         // An error occurred
     }).catch(err => console.log(err));
  }
  public submit() {
    var batch = this.db.firestore.batch()
    this.tobePaid.forEach(event => {
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
    }).catch(err => console.log(err))
  }
} 

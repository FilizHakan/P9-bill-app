import { ROUTES_PATH } from '../constants/routes.js'
import Logout from './Logout.js'

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`);
    formNewBill.addEventListener("submit", this.handleSubmit);
    const file = this.document.querySelector(`input[data-testid="file"]`);
    file.addEventListener("change", this.handleChangeFile);
    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;
    new Logout({ document, localStorage, onNavigate });

    // Set up form error
    const formError = document.createElement("div");
    formError.setAttribute("class", "formError errorIsHidden");
    formError.setAttribute("data-testid", "form-error");
    formError.innerHTML = "Veuillez remplir tous les champs obligatoires";
    this.document.querySelector("#newBillForm").appendChild(formError);

    // Set up extension error
    const extensionError = document.createElement("div");
    extensionError.innerHTML = "Le format du fichier doit être obligatoirement soit png, jpeg ou jpg";
    extensionError.setAttribute("class", "extensionError errorIsHidden");
    extensionError.setAttribute("data-testid", "extension-error");
    this.document.querySelector(`input[data-testid="file"]`).parentNode.appendChild(extensionError);
  }
  
  handleChangeFile = e => {
    e.preventDefault()
    const file = this.document.querySelector(`input[data-testid="file"]`).files[0]
    const filePath = e.target.value.split(/\\/g)
    const fileName = filePath[filePath.length-1]
    const formData = new FormData()
    const email = JSON.parse(localStorage.getItem("user")).email
    formData.append('file', file)
    formData.append('email', email)

    const extensionCheck = /(png|jpeg|jpg)/g; // Compulsory extensions
    const extensionFormat = fileName.split(".").pop().toLowerCase();
    
    if(extensionFormat.match(extensionCheck)){
    this.store
      .bills()
      .create({
        data: formData,
        headers: {
          noContentType: true
        }
      })
      .then(({fileUrl, key}) => {
        console.log(fileUrl)
        this.billId = key
        this.fileUrl = fileUrl
        this.fileName = fileName
      }).catch(error => console.error(error))
    } else {
      const extensionError = this.document.querySelector(".extensionError");
      extensionError.setAttribute("class", "extensionError errorIsShown")
      this.document.querySelector('input[data-testid="file"]').value = null;
    }
  }
  handleSubmit = e => {
    e.preventDefault()
    console.log('e.target.querySelector(`input[data-testid="datepicker"]`).value', e.target.querySelector(`input[data-testid="datepicker"]`).value)
    const email = JSON.parse(localStorage.getItem("user")).email
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name:  e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
      date:  e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: 'pending'
    }

    if (!bill.name || !bill.date || !bill.amount || !bill.pct) // If one of the required fields is not filled out then error alert is shown
    {
      const formError = this.document.querySelector(".formError");
      formError.setAttribute("class", "formError errorIsShown");
    } else {
      const formError = this.document.querySelector(".formError");
      formError.setAttribute("class", "formError errorIsHidden");
      this.updateBill(bill);
      this.onNavigate(ROUTES_PATH['Bills']);
      }
    };

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
      .bills()
      .update({data: JSON.stringify(bill), selector: this.billId})
      .then(() => {
        this.onNavigate(ROUTES_PATH['Bills'])
      })
      .catch(error => console.error(error))
    }
  }
}
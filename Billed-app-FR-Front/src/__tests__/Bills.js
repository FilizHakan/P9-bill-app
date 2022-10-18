/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import store from "../__mocks__/store";
import userEvent from "@testing-library/user-event";
import { screen, waitFor, getByTestId } from "@testing-library/dom";
import Bills from "../containers/Bills.js";
import BillsUI from "../views/BillsUI.js";
import router from "../app/Router.js";
import { bills } from "../fixtures/bills.js";
import mockStore from "../__mocks__/store";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import { row } from "../views/BillsUI.js";

jest.mock("../app/store", () => mockStore)

const setup = async () => {

  // Create an object with the adaquate properties
  Object.defineProperty(window, "localStorage", { value: localStorageMock });
  
  // Connect as an employee
  window.localStorage.setItem(
    "user",
    JSON.stringify({ type: "Employee", email: "a@a" })
  );

  // Create a div as in the DOM
  const root = document.createElement("div");
  root.setAttribute("id", "root");
  // Add the div with append
  document.body.append(root);

  // Initialise router function
  router();

  // Call back root function
  return root;
};

// TEST 1: L'icone a gauche a un background plus clair
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      
      await setup();

      // Surfing on Bills page 
      window.onNavigate(ROUTES_PATH.Bills)

      // Get the tested icon
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      console.log(windowIcon)

      // Check that the icon has the highlighted class given by active-icon
      expect(windowIcon).toBeTruthy();
      expect(windowIcon.classList).toContain("active-icon");

    });
    // TEST 1: Les dates des billets sont triees du plus recent au plus ancien
    test("Then, bills should be ordered from most recent to oldest", () => {
      // Add the view on the Bill page
      document.body.innerHTML = BillsUI({ data: bills })
      
      // Get the dates
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.getAttribute("data-testid"));
      
      // Sort dates by ascending order
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      
      // Test if the dates are sorted out like as in the test
      expect(dates).toEqual(datesSorted)
    });

    // TEST 2: le formulaire pour la nouvelle note de frais s'affiche
    describe("When I click on the 'Nouvelle note de frais' button", ()=>
    {
      test("Then, the NewBill form should appear", async()=>
      {
        await setup();

        // Fetch the new bill Button
        const newBillButton = getByTestId(document.body, "btn-new-bill");

        // Mock of the navigation function
        const onNavigate = jest.fn(window.onNavigate(ROUTES_PATH.Bills))

        // Fake a user's click on the button with a listener and userEvent
        newBillButton.addEventListener("click", onNavigate);
        userEvent.click(newBillButton);

        // Assertions: check if the new bill page is properly displayed
        expect(getByTestId(document.body, "send-new-bill")).toHaveTextContent("Envoyer une note de frais");
      });
    });

    // TEST 3: La modale des justificatifs n'est pas affichee
    test("Then, the modal of the file should NOT be appearing", ()=>
    {
      // Add the Bill page view
      document.body.innerHTML = BillsUI({ data: bills});

      // Fetch modal
      const modaleFile = document.getElementById("modaleFile");
      
      // Assertion: Check that the modale has no class
      expect(modaleFile).not.toHaveClass('show');
    });

    // TEST 4: Le bonne modale du billet s'affiche
    describe("When I click on an eye icon", ()=>
    {
      test("Then, the right modal should appear", ()=>
      {
        document.body.innerHTML = BillsUI({data: bills});
        const currentBills = new Bills({document, onNavigate, store, localStorageMock});
        
        // Mock the JQuery used in Bills
        $.fn.modal = jest.fn();
        const spyOnModal = jest.spyOn($.fn, "modal");

        // Fetch eye icons
        const eyeIcons = screen.getAllByTestId("icon-eye");

        // Get all of them
        eyeIcons.map((eyeIcon) =>
        {
          userEvent.click(eyeIcon);
        });

        // Assertion: 
        expect(spyOnModal).toHaveBeenCalledTimes(4);
      });
    });

    // TEST 5: les notes de frais sont visibles
    test("Then, the bill shows", ()=>
    {
      // JQuery Mock used in Bills
      $.fn.modal = jest.fn();

      // Create the object for the new bill
      const onNavigate = (pathname) =>
      {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const store = null;
      const currentBill2 = new Bills({ document, onNavigate, store, localStorage: window.localStorage });

      // Add bill view with a data
      document.body.innerHTML = BillsUI(bills[0]);
      const tBody = screen.getByTestId("tbody");
      tBody.innerHTML = row(bills[0]);

      // Fetch icon eye
      const eyeIcons = screen.getByTestId("icon-eye");
      
      // Fetch modal
      const modaleFile = document.getElementById("modaleFile");

      // Mock of our object
      const handleClickIconEye = jest.fn(currentBill2.handleClickIconEye(eyeIcons));
      
      // Simulate a click on the icon eye
      eyeIcons.addEventListener("click", ()=>
      {
        handleClickIconEye;
        $.fn.modal = jest.fn(()=> modaleFile.classList.add("show"));
        userEvent.click(eyeIcons);

        // Check the class of the modal is "show"
        expect(modaleFile).toHaveClass("show"); 
      });
    });

    // TEST 6: les bonnes notes de frais sont affichees
    test("Then, the right corresponding bill shows", ()=>
    {
      // Add Bill view
      document.body.innerHTML = BillsUI(bills[0]);
      const tBody = screen.getByTestId("tbody");
      tBody.innerHTML = row(bills[0]);

      // Fetch icon eye
      const eyeButton = screen.getByTestId("icon-eye");

      // Assertion: chekc of the modal shows the right corresponding file
      expect(eyeButton.getAttribute("data-bill-url")).toEqual("https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a");
    });
  });
});

// TEST 7: Integration test GET (Bills)
describe("Given I am a connected as en employee", ()=> 
{
  describe("When I am on my personal Dashboard", ()=> 
  {
    test("Fetches bills from mock API GET", async()=> 
    {
      const getSpyOn = jest.spyOn(store, "bills");
      const bills = await store.bills().list();

      // Assertions: bills are properly fetched
      expect(getSpyOn).toHaveBeenCalledTimes(1);
      expect(bills.length).toBe(4);
    });

    test("Fetches bills from an API and fails with a 404 message error", async()=> 
    {
      store.bills.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );

      document.body.innerHTML = BillsUI({ error: "Erreur 404" });
      const message = await screen.getByText(/Erreur 404/);

      // Assertion: check if the message displays
      expect(message).toBeTruthy();
    });

    test("Fetches bills from an API and fails with a 500 message error", async()=>
    {
      store.bills.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      );
      document.body.innerHTML = BillsUI({ error: "Erreur 500" });
      
      // Search for the message error
      const message = await screen.getByText(/Erreur 500/);

      // Assertion: 
      expect(message).toBeTruthy();

    });
  });
});

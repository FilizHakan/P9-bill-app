/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import store from "../__mocks__/store";
import userEvent from "@testing-library/user-event";
import { screen, waitFor, prettyDOM, getByTestId } from "@testing-library/dom";
import Bills from "../containers/Bills.js";
import BillsUI from "../views/BillsUI.js";
import router from "../app/Router.js";
import { bills } from "../fixtures/bills.js";
import mockStore from "../__mocks__/store";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";

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

    test("Then, bills should be ordered from most recent to oldest", () => {
      // Add the view on the Bill page
      document.body.innerHTML = BillsUI({ data: bills })
      
      // Get the dates
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.getAttribute("data-testid"));
      
      // Sort dates by ascending order
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      
      // Test if the dates are sorted like as in the test
      expect(dates).toEqual(datesSorted)
    });

    test("Then, adding a new bill should be reloading the NewBills page", ()=>
    {
      document.body.innerHTML = BillsUI({ data: bills});
      const onNavigate = (pathname) =>
      {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const currentBills = new Bills({document, onNavigate, store, localStorageMock});  

      const handleClickNewBill = jest.fn((e) => currentBills.handleClickNewBill(e));

      const newBills = screen.getByTestId("btn-new-bill");
      newBills.addEventListener("click", handleClickNewBill);
      userEvent.click(newBills);
      
      const newBillForm = screen.getByTestId("form-new-bill");
      
      // Assertion:
      expect(newBillForm).toBeTruthy();
    });

    describe("When I click on the 'Envoyer une nouvelle note de frais' button", ()=>
    {
      test("Then, the New Bill form should appear", async()=>
      {
        await setup();

        // Fetch the new bill Button
        const newBillButton = getByTestId(document.body, "btn-new-bill");

        // Mock of the navigation function
        const onNavigate = jest.fn(window.onNavigate(ROUTES_PATH.Bills))

        // Fake a user's click on the button with a listener and userEvent
        newBillButton.addEventListener("click", onNavigate);
        userEvent.click(newBillButton);

        // Fetch the sending button
        const sendNewBill = getByTestId(document.body, "send-new-bill");

        // Assetions: check if the new bill page is properly displayed
        expect(sendNewBill).toHaveTextContent("Envoyer une note de frais");
      });
    });

    describe("When I click on an eye icon", ()=>
    {
      test("Then, the modal should appear", ()=>
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
  });
});

// Integration test GET (Bills)
describe("Given I am a user connected as en employee", ()=> 
{
  describe("When I am on my personal Dashboard", ()=> 
  {
    test("Fetches bills from mock API GET", async ()=> 
    {
      const getSpyOn = jest.spyOn(store, "bills");
      const bills = await store.bills().list();

      // Assertions:
      expect(getSpyOn).toHaveBeenCalledTimes(1);
      expect(bills.length).toBe(4);
    });

    test("Fetches bills from an API and fails with 404 message error", async ()=> 
    {
      store.bills.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      );

      document.body.innerHTML = BillsUI({ error: "Erreur 404" });
      const message = await screen.getByText(/Erreur 404/);

      // Assertions: check if the message displays
      expect(message).toBeTruthy();
    });
  });
});

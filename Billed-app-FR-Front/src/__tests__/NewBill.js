/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, waitFor, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import BillsUI from "../views/BillsUI.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../app/Router.js"
import NewBill from "../containers/NewBill.js";
import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore);

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

describe("Given I am connected as an employee", () => 
{
  describe("When I am on NewBill Page", () => 
  {
    test("Then the new bill form should be shown", async() => 
    {
      // Await setup function first
      await setup();

      // Navigate on the new bill page
      window.onNavigate(ROUTES_PATH.NewBill);

      // Get the text page title and test what we expect the value, when cast to a boolean, will be a truthy value
      const getTitle = screen.getByText("Envoyer une note de frais");
      // Assertion for getTitle
      expect(getTitle).toBeTruthy();
      
      // Get the new bill form by data-testid and test what we expect the value, when cast to a boolean, will be a truthy value
      const getForm = screen.getByTestId("form-new-bill");
      // Assertion for getForm
      expect(getForm).toBeTruthy();

      // Get contact form fields by data-testid
      const fields =
      {
        type: screen.getByTestId("expense-type"), 
        name: screen.getByTestId("expense-name"),
        date: screen.getByTestId("datepicker"),
        amount: screen.getByTestId("amount"),
        vat: screen.getByTestId("vat"),
        pct: screen.getByTestId("pct"),
        commentary: screen.getByTestId("commentary"),
        file: screen.getByTestId("file"),
      };

      // Method returns an array of the object fields' own property names and we test each property names to be true thanks to the imbrication of expect in the forEach() loop method
      Object.keys(fields).forEach((key) => expect(fields[key]).toBeTruthy());

    });

    test("Then an alert error should not pop on the user's screen", async() =>
    {
      // Await setup function first
      await setup();

      // Navigate on the new bill page
      window.onNavigate(ROUTES_PATH.NewBill);

      // Monitor the function when creating a new bill ("note de frais") with a spy
      // Fetch bills() from app/Router
      const getBills = mockStore.bills();
      // Spy when there is a bill creation
      const newBillCreation = jest.spyOn(getBills, "create");

      // Fetch the form error
      const formError = screen.getByTestId("form-error");
      // The form error has to be truthy
      expect(formError).toBeTruthy();
      // The form error has to have the class "errorIsHidden"
      expect(formError).toHaveClass("errorIsHidden");

    });

    // Upload a file that is allowed jpeg, jpg or png
    describe("when I upload a file with the right extension", () =>
    {
      test("Then the file should be uploaded by calling the function store.bills().create()", async () =>
      {
        // Call the setup function and transform it in an async function
        await setup();

        // Navigate on the newbill page
        window.onNavigate(ROUTES_PATH.NewBill);

        // Monitor the function when creating a new bill ("note de frais") with a spy
        // Fetch bills() from app/Router
        const getBills = mockStore.bills();
        // Spy jest when there is a bill creation
        const newBillCreation = jest.spyOn(getBills, "create");

        // Fields
        // Get file upload by data-testid
        const fileUpload = screen.getByTestId("file");
        // Set up a time 
        const now = new Date();
        // New bill simulation
        // Set up the type
        const getFileType = new File(["Test"], "test.png", 
        {
          type: "image/png",
          lastModified: now.getTime(),
        });

        // Test simulation for adding a file .png
        fireEvent.change(fileUpload, 
          {
            target: 
            {
              files: [getFileType],
            }
          });

          // Use process.nextTick to ensure asynchronous actions are resolved before running assertions during tests
          await waitFor(() => process.nextTick);

          // Test the two assertions as followed:
          // the function that create the new bill is not to be called
          expect(getBills.create).not.toBeCalled();
          // The fragment identifier # (hash) in the URL has to be directed on the new bill page
          expect(window.location.hash).toBe(ROUTES_PATH.NewBill);

          // Reset all mocks automatically
          jest.resetAllMocks();

      });
    });

    // Test if the user upload a file with a disallowed extension
    describe("When I upload a file with the wrong extension", () =>
    {
      test("Then an error alert should pop on the screen of the user before any upload is allowed", async() =>
      {
        // Call setup function and transform it into an async function
        await setup();

        // Be on the new bill page
        window.onNavigate(ROUTES_PATH.NewBill);

        // Monitor the function when creating a new bill ("note de frais") with a spy
        // Fetch bills() from app/Router with mockStore
        const getBills = mockStore.bills();
        // Spy jest when the user create a new bill
        const newBillCreation = jest.spyOn(getBills, "create");
        
        // Fields
        // Get file upload by data-testid
        const fileUpload = screen.getByTestId("file");

        // Create new bill simulation
        // Set up the type
        const getFileType = new File(["Test"], "test.txt");
        // New fileUpload submission 
        fireEvent.change(fileUpload, 
          {
            target: 
            {
              files: [getFileType],
            }
          });

        // The function has to be called upon for this test
        expect(fileUpload).toHaveBeenCalled();

        // Fetch the error message
        const error = screen.getByTestId("extension-error");

        // The fetched error message has to be truthy
        expect(error).toBeTruthy();

        // And it has to have the class "errorIsShown" 
        expect(error).toHaveClass("errorIsShown");
      });
    });


  });
});

// Test if the form is NOT valid
describe("When I don't fill out all the required fields", () =>
{
  test("Then clicking on submit should not do anything", async()=>
  {
    // Call setup function and transform it into an async function
    await setup();

    // Get the form by data-testid in UI
    const getForm = screen.getByTestId("form-new-bill");

    // Form submission
    fireEvent.submit(getForm);

    // Assertion to be verified is as followed:
    // Submission with the # in URL on new bill page should not be redirected
    expect(window.location.hash).toBe(ROUTES_PATH.NewBill);

  });
});

// Integration test for POST (API)
describe("Given I am connected as an employee", ()=>
{
  describe("When I am on newBill page", ()=>
  {
    describe("When I do fill out all the required field", ()=>
    {
      describe("When the API shows an 500 alert error", ()=>
      {
        test("Then submitting the form should not redirect the user on the bills page", async () =>
        {
          // Call setup function and transform it into an async function
          await setup();

          // Surf on the new bill page
          window.onNavigate(ROUTES_PATH.NewBill);

          // Spy on when the bills is updated - 500 error
          const getBills = mockStore.bills();
          jest.spyOn(getBills, "update").mockImplementation((bill) => {
            return Promise.reject(new Error("Erreur 500"));
          });

          // Fetch by data-testid and set up useful functions to check input values for each fields
          const getForm = screen.getByTestId("form-new-bill");
          const fields = 
          {
            type: screen.getByTestId("expense-type"),
            name: screen.getByTestId("expense-name"),
            date: screen.getByTestId("datepicker"),
            amount: screen.getByTestId("amount"),
            vat: screen.getByTestId("vat"),
            pct: screen.getByTestId("pct"),
            commentary: screen.getByTestId("commentary"),
            fileUrl: screen.getByTestId("file"),
            fileName: screen.getByTestId("file"),
          };
          const now = new Date();
          const today = now.getFullYear() + "/" + month + "/" + day;
          const day = ("0" + now.getDate()).slice(-2);
          const month = ("0" + (now.getMonth() + 1)).slice(-2);

          // Inject value in inputs' fields for test purpose
          fields.name.value = "Test nom";
          fields.date.value = today;
          fields.amount.value = 100;
          fields.commentary.value = "Test commentaire";
          fields.vat.value = 50;
          fields.pct.value = 10;

          // Form submission
          fireEvent.submit(getForm);

          // Use process.nextTick to ensure asynchronous actions are resolved before running assertions during tests
          await waitFor(()=> process.nextTick);

          // The function store.bills().update has to be called
          expect(getBills.update).toBeCalled();
          // Not redirect on bills page
          expect(window.location.hash).not.toBe(ROUTES_PATH.Bills);

          jest.restoreAllMocks();

        });
      });
    });
  });
});


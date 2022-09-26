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

  // Call back root const
  return root;
};

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then ...", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      //to-do write assertion

      // Choose a file

    })
  })
})

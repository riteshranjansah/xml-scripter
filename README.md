# **XML Scripter**

**XML Scripter** is a web-based tool designed to streamline the creation of XML scripts. It integrates two powerful editors: **TinyMCE** for rich text editing and **Ace Editor** for XML editing. This tool allows users to generate XML structures with ease, thanks to its intuitive interface and various options for formatting and inserting XML elements. 

## **Features**
- **Rich Text Editing (TinyMCE)**: Input and format your text with standard text editing tools.
- **XML Editor (Ace Editor)**: Easily edit and generate XML code with syntax highlighting and advanced features.
- **Pre-built Elements**: Choose from a variety of question types (e.g., Radio, Checkbox, Select) and structure elements (e.g., Rows, Cols, Choice) to quickly build XML components.
- **Custom Attributes**: Add specialized XML attributes such as randomization, grouping, and conditional elements.
- **Dynamic File Upload**: Upload `.txt` files to dynamically generate XML snippets based on predefined formats.
- **Generate XML Button**: Automatically generate XML based on your content and settings.

## **Folder Structure**

- **index.html**: The main entry point for the web app.
- **src/**:
  - `images/`: Contains any images used within the app.
  - `Guide.pdf`: A user guide explaining how to use the tool.
  - `sample.txt`: A sample text file for testing purposes.
  - `script.js`: The core JavaScript functions that handle the XML generation and editor controls.
  - `style.css`: Stylesheets for the layout and design of the application.
- **tinymce/**: Contains the necessary files for setting up the TinyMCE editor.

## **How to Use**

1. **Load the Application**: Open `index.html` in your browser.
2. **Rich Text Editor (Left Panel)**: Use this to input and format your content. You can style text, insert lists, and apply other rich formatting options.
3. **XML Editor (Right Panel)**: View and edit the generated XML. You can also manually insert XML tags or adjust the structure.
4. **Buttons and Options (Center Panel)**:
   - Use the **Generate XML** button to create XML from your text input.
   - The dropdown menus allow you to insert predefined elements like Radio Buttons, Checkboxes, Text inputs, and more.
   - Customizable attributes let you further define how the XML behaves (e.g., adding randomization, setting values).
5. **Upload Custom Files**: In the "Custom Setups" section, upload your `.txt` file, and the tool will generate XML snippets based on the file’s content.

## **Key Features in Detail**
- **Checkbox Toggles**: Control formatting options such as cleaning PN elements, matching labels, or adding incremental values.
- **Text Formatting**: Apply formatting like bold, italics, underline, or create lists and line breaks directly in the XML.
- **Control Elements**: Add advanced elements like blocks, loops, and attributes that enhance the logic and structure of your XML.
  
## **Installation**

You can clone the repository and run the application locally:

```bash
git clone https://github.com/riteshranjansah/xml-scripter.git
```

Open `index.html` in your browser to use the tool.

## **Contributions**

Feel free to fork the project and submit pull requests if you would like to contribute!

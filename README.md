# Qiasat Aradi (Land Measurements) 

## 🌾 About The Project
Qiasat Aradi is a comprehensive agricultural land measurement and calculation tool designed specifically for farmers and agricultural land owners. It provides accurate measurements, conversions, and calculations for agricultural lands using traditional Egyptian measurement units.

👉 **[Live Preview of Qiasat Aradi](https://tryomar.github.io/qiasat-aradi/)** 👈

## 🚀 Features 

### Core Functionalities
1. **Land Measurement Calculator**
   - Calculate total land area
   - Measure length and width
   - Convert between different measurement units

2. **Agricultural Tools**
   - Farm and farmer calculations
   - Land boundary separation
   - Land subtraction and division
   - Agricultural inheritance division
   - Irrigation layout calculator

3. **Unit Conversion Tools**
   - Convert between:
     - Kassaba to meters
     - Meters to Kassaba
     - Kirat to square meters
     - Square meters to Kirat
     - Feddan-Kirat-Sahm calculations

4. **Special Features**
   - Al-Dallal (Agricultural Broker Tool)
   - Hatita (Advanced Area Calculation)
   - "Who Will Win The Feddans" (Educational Game)

## 🔧 Traditional Egyptian Land Measurement Units
- **Feddan**: Main unit of land measurement
- **Kirat**: 1/24 of a Feddan
- **Sahm**: 1/24 of a Kirat
- **Kassaba**: Traditional length measurement unit

## 💻 Technologies Used
- HTML5
- CSS3
- JavaScript (ES6 Modules & Global Compatibility Wrappers)

## 🏛️ Shared Infrastructure (v2.2 Architecture)
The project utilizes a modular, single-source-of-truth shared architecture located under `shared/`:

```
shared/
├── calculations/           # Unified Calculation Engines (Commit 12 Architecture)
│   ├── geometry.js        # Pure Geometry & Area Engine
│   ├── units.js           # Pure Unit Conversion & Agricultural Fractions Engine
│   ├── validation.js      # Pure Input & Numerical Stability Validation Engine
│   └── partition.js       # Pure Partition & Share Distribution Engine
├── partition-table.js      # Unified Partners Table Logic & UI Helpers
├── formatters.js           # Unified String & Number Formatted Display Engine
├── report-template.js      # Dallal Unified Print Report Engine
├── storage.js              # Dallal Unified Storage & Migration Layer
├── toast.js                # Unified Toast Notification System
├── agri-units-compat.js    # Compatibility Bridge for Traditional Egyptian Agricultural Units
└── adapters/               # Page Data Adapters (page11-adapter.js, page13-adapter.js, etc.)
```

## 📱 Target Users
- Farmers
- Agricultural Land Owners
- Land Brokers
- Agricultural Engineers
- Land Surveyors

## 🌟 Key Benefits
- Easy-to-use interface
- Accurate calculations
- Support for traditional Egyptian measurement units
- Comprehensive land management tools
- Educational features for new users

## 🔄 Future Updates
- [List planned features or improvements]
- [Add any upcoming enhancements]

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Contact
- **Idea and Project Manager**: Abdelrahman Abbas  
- **Developers**:  
  - Omar Abdelrahman Abbas  
  - Abbas Abdelrahman Abbas  
- **Email**: [dalalarady@gmail.com](mailto:dalalarady@gmail.com)  
- **GitHub**: [Omar7001-B/qiasat-aradi](https://github.com/Omar7001-B/qiasat-aradi)  
- **Privacy Policy**: [View Document](https://docs.google.com/document/d/1zFlprM9lHa3siWl_uSNU5SGPVvBV9BHCAboS6Wc_lRc/edit?usp=sharing)

## 🙏 Acknowledgments
- Special thanks to all Egyptian farmers and agricultural experts who provided insights
- [Add any other acknowledgments]

---
*Note: This application is specifically designed for Egyptian agricultural land measurements and calculations.*
 

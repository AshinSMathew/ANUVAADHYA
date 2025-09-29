# FastAPI Backend

This is the backend service built with **FastAPI**.

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/AshinSMathew/CINEHACK.git
cd CINEHACK/backend
```
### 2. Create a Virtual Environment (recommended)
```bash
python -m venv venv
```

- Windows (PowerShell):

```bash
venv\Scripts\activate
```

- Linux/Mac:

```bash
source venv/bin/activate
```
### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the FastAPI Server
```bash
python -m uvicorn test:app --reload
```
By default, the app will be available at: **http://127.0.0.1:8000**


# SARVAM AI

- Go to the url **https://dashboard.sarvam.ai/signin**
- Create an account
- On the home page, click the button **Get API Key**
- Click the **+ Create API Key** button
- Add the key name(any) and click create
- Copy the API KEY
- Create an **.env** file inside **/backend**
- Add the API KEY as 
```bash
SARVAM_API_KEY = <YOUR_API_KEY>
```
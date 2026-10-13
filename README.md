ECG Abnormality Detection is a machine learning project that uses a Convolutional Neural Network (CNN) to classify electrocardiogram (ECG) heartbeat signals into different categories.

The system learns patterns from labelled ECG signals and predicts the category of a given heartbeat. The project aims to demonstrate how deep learning can be applied to ECG signal classification and how automated analysis can support research in cardiac signal processing.

The project includes ECG data preprocessing, CNN model training, performance evaluation, and a web-based interface for displaying predictions.

Note: This project is intended for educational and research purposes and is not a substitute for professional medical diagnosis.

2. Objectives

To explore and understand ECG heartbeat signals.

To preprocess ECG data for deep learning.

To develop a 1D Convolutional Neural Network for heartbeat classification.

To classify ECG heartbeat samples into five categories.

To evaluate the model using appropriate classification metrics.

To develop a simple web interface for ECG signal prediction.

3. Dataset

We use the ECG Heartbeat Categorization Dataset available on Kaggle.

Dataset link: https://www.kaggle.com/datasets/shayanfazeli/heartbeat

The dataset combines preprocessed heartbeat samples originating from the MIT-BIH Arrhythmia Database and the PTB Diagnostic ECG Database.

For the initial five-class classification task, we use:

mitbih_train.csv — training samples.

mitbih_test.csv — testing samples.

Each MIT-BIH CSV file contains 187 numerical ECG signal values followed by a class label.

Heartbeat Classes

Label

Class

Description

0

Normal (N)

Normal heartbeat

1

Supraventricular ectopic (S)

Ectopic heartbeat originating above the ventricles

2

Ventricular ectopic (V)

Ectopic heartbeat originating in the ventricles

3

Fusion beat (F)

Beat with combined normal and ventricular activation

4

Unknown (Q)

Unknown or unclassified heartbeat category

The dataset is imbalanced, meaning that some heartbeat classes have significantly more examples than others. Therefore, class-wise evaluation metrics are important.

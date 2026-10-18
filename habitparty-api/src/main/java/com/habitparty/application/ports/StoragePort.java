package com.habitparty.application.ports;

import java.io.InputStream;

public interface StoragePort {
  String uploadFile(InputStream contentStream, String originalFilename, long size);
}

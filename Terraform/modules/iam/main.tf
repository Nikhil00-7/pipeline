resource "aws_iam_role" "cluster_role" {
  name = var.iam_role_eks
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

tags = {
  environment= var.environment
}
}

resource "aws_iam_role_policy_attachment" "cluster_role_attachment" {
     role = aws_iam_role.cluster_role.name
     policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

resource "aws_iam_role" "eks_node_role" {
  name = "${var.iam_role_eks}-node-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
  tags = {
    environment= var.environment
  } 
}


resource "aws_iam_policy" "backup_policy" {
  name = "${var.backup_policy}-backup-policy"


  policy = jsonencode({
    Version = "2012-10-17"
    Statement =[
      {
        Effect = "Allow"
        Action =[
             "ec2:DescribeVolumes",
                "ec2:DescribeSnapshots",
                "ec2:CreateTags",
                "ec2:CreateVolume",
                "ec2:CreateSnapshot",
                "ec2:DeleteSnapshot"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        
          Action =[
             "s3:GetObject",
                "s3:DeleteObject",
                "s3:PutObject",
                "s3:AbortMultipartUpload",
                "s3:ListMultipartUploadParts",
                  "s3:ListBucket"
          ]
          Resource = "arn:aws:s3:::${var.bucket_name}/*"
      }
    ]
  })
}


resource "aws_iam_role" "velero_role" {
   name = var.velero_role 
   assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement =[
      {
        Effect = "Allow"
        Principal = {
          Federated = var.oidc_provider_arn  
        }
      Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${var.oidc_provider_arn}:sub" = "system:serviceaccount:velero:velero"
          }
        }
      }
     ]
   })
}


resource "aws_iam_role_policy_attachment" "worker_node_policy" {
    role = aws_iam_role.eks_node_role.name
    policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
}


resource "aws_iam_role_policy_attachment" "cni_policy" {
  role = aws_iam_role.eks_node_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
}

resource "aws_iam_role_policy_attachment" "ecr_readOnly" {
  role= aws_iam_role.eks_node_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_role_policy_attachment" "lb_controller_node_policy" {
  role       = aws_iam_role.eks_node_role.name
  policy_arn = "arn:aws:iam::aws:policy/ElasticLoadBalancingFullAccess"
}

